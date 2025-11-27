"""
MatruRaksha AI - Authentication Middleware
JWT authentication and role-based access control
"""

import os
import logging
from typing import Optional, List
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from dotenv import load_dotenv

import os
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
logger = logging.getLogger(__name__)

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Security scheme
security = HTTPBearer()


class AuthMiddleware:
    """Authentication and Authorization Middleware"""
    
    @staticmethod
    async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
        """
        Verify JWT token and return user data
        
        Args:
            credentials: HTTP Authorization credentials
            
        Returns:
            User data dict
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            token = credentials.credentials
            
            # Verify token with Supabase
            user_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            user_client.auth.set_session(token, None)
            
            response = user_client.auth.get_user()
            
            if not response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            # Get user profile
            profile = supabase.table("user_profiles").select("*").eq(
                "id", response.user.id
            ).execute()
            
            if not profile.data:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User profile not found"
                )
            
            profile_data = profile.data[0]
            
            # Check if user is active
            if not profile_data.get("is_active", False):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User account is inactive"
                )
            
            return {
                "id": response.user.id,
                "email": response.user.email,
                "role": profile_data.get("role"),
                "full_name": profile_data.get("full_name"),
                "phone": profile_data.get("phone"),
                "assigned_area": profile_data.get("assigned_area"),
                "is_active": profile_data.get("is_active")
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Token verification error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )
    
    @staticmethod
    def require_role(allowed_roles: List[str]):
        """
        Dependency to require specific roles
        
        Args:
            allowed_roles: List of allowed roles (e.g., ["ADMIN", "DOCTOR"])
            
        Returns:
            Dependency function
        """
        async def role_checker(current_user: dict = Depends(AuthMiddleware.verify_token)) -> dict:
            user_role = current_user.get("role")
            
            if user_role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
                )
            
            return current_user
        
        return role_checker
    
    @staticmethod
    async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
        """
        Get current authenticated user
        
        Args:
            credentials: HTTP Authorization credentials
            
        Returns:
            User data dict
        """
        return await AuthMiddleware.verify_token(credentials)
    
    @staticmethod
    async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
        """
        Get current user if authenticated, None otherwise
        
        Args:
            credentials: Optional HTTP Authorization credentials
            
        Returns:
            User data dict or None
        """
        if not credentials:
            return None
        
        try:
            return await AuthMiddleware.verify_token(credentials)
        except HTTPException:
            return None


# Helper functions for common role checks
async def require_admin(current_user: dict = Depends(AuthMiddleware.require_role(["ADMIN"]))) -> dict:
    """Require ADMIN role"""
    return current_user


async def require_doctor(current_user: dict = Depends(AuthMiddleware.require_role(["DOCTOR", "ADMIN"]))) -> dict:
    """Require DOCTOR or ADMIN role"""
    return current_user


async def require_asha_worker(current_user: dict = Depends(AuthMiddleware.require_role(["ASHA_WORKER", "DOCTOR", "ADMIN"]))) -> dict:
    """Require ASHA_WORKER, DOCTOR, or ADMIN role"""
    return current_user


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user"""
    return await AuthMiddleware.get_current_user(credentials)


async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """Get current user if authenticated"""
    return await AuthMiddleware.get_optional_user(credentials)

