"""
MatruRaksha AI - Authentication Service
Handles user authentication, authorization, and session management using Supabase Auth
"""

import os
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
logger = logging.getLogger(__name__)

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Client for auth operations (use service role for admin operations)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY)
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class AuthService:
    """Service for authentication and authorization"""
    
    @staticmethod
    async def sign_up(
        email: str,
        password: str,
        full_name: str,
        role: str = "ASHA_WORKER",
        phone: Optional[str] = None,
        assigned_area: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Register a new user with email and password
        
        Args:
            email: User's email address
            password: User's password
            full_name: User's full name
            role: User role (ADMIN, DOCTOR, ASHA_WORKER)
            phone: Optional phone number
            assigned_area: Optional assigned area
            
        Returns:
            Dict containing user data and session
        """
        try:
            # Validate role
            if role not in ["ADMIN", "DOCTOR", "ASHA_WORKER"]:
                raise ValueError("Invalid role. Must be ADMIN, DOCTOR, or ASHA_WORKER")
            
            # Sign up user with Supabase Auth
            response = supabase_client.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": full_name,
                        "role": role,
                        "phone": phone,
                        "assigned_area": assigned_area
                    }
                }
            })
            
            if response.user:
                logger.info(f"✅ User signed up successfully: {email} ({role})")
                
                # Update user profile with additional data
                if phone or assigned_area:
                    profile_data = {}
                    if phone:
                        profile_data["phone"] = phone
                    if assigned_area:
                        profile_data["assigned_area"] = assigned_area
                    
                    supabase_admin.table("user_profiles").update(profile_data).eq(
                        "id", response.user.id
                    ).execute()
                
                # Link to doctor or asha_worker table based on role
                if role == "DOCTOR":
                    await AuthService._create_doctor_entry(response.user.id, full_name, phone, assigned_area, email)
                elif role == "ASHA_WORKER":
                    await AuthService._create_asha_worker_entry(response.user.id, full_name, phone, assigned_area, email)
                
                return {
                    "success": True,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "role": role,
                        "full_name": full_name
                    },
                    "session": response.session.__dict__ if response.session else None
                }
            else:
                raise Exception("Sign up failed - no user returned")
                
        except Exception as e:
            logger.error(f"❌ Sign up error: {e}")
            raise Exception(f"Sign up failed: {str(e)}")

    @staticmethod
    async def create_registration_request(
        email: str,
        full_name: str,
        role: str,
        phone: Optional[str] = None,
        assigned_area: Optional[str] = None,
        degree_cert_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a pending registration request
        """
        try:
            if role not in ["DOCTOR", "ASHA_WORKER"]:
                raise ValueError("Invalid role. Only DOCTOR or ASHA_WORKER allowed")

            payload = {
                "email": email,
                "full_name": full_name,
                "role_requested": role,
                "phone": phone,
                "assigned_area": assigned_area,
                "degree_cert_url": degree_cert_url,
                "status": "PENDING"
            }
            resp = supabase_admin.table("registration_requests").insert(payload).execute()
            return resp.data[0] if resp.data else payload
        except Exception as e:
            logger.error(f"❌ Create registration request error: {e}")
            raise

    @staticmethod
    async def list_registration_requests(status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            query = supabase_admin.table("registration_requests").select("*")
            if status_filter:
                query = query.eq("status", status_filter)
            resp = query.order("created_at", desc=False).execute()
            return resp.data or []
        except Exception as e:
            logger.error(f"❌ List registration requests error: {e}")
            return []

    @staticmethod
    async def approve_registration_request(request_id: int, reviewer_id: str, note: Optional[str] = None) -> Dict[str, Any]:
        """
        Approve a registration request and create Supabase Auth user
        """
        try:
            req_resp = supabase_admin.table("registration_requests").select("*").eq("id", request_id).single().execute()
            if not req_resp.data:
                raise ValueError("Request not found")
            req = req_resp.data
            if req.get("status") != "PENDING":
                raise ValueError("Request is not pending")

            role = req.get("role_requested")
            email = req.get("email")
            full_name = req.get("full_name")
            phone = req.get("phone")
            assigned_area = req.get("assigned_area")

            import secrets
            temp_password = secrets.token_urlsafe(12)

            created = supabase_admin.auth.admin.create_user({
                "email": email,
                "password": temp_password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": full_name,
                    "role": role,
                    "phone": phone,
                    "assigned_area": assigned_area
                }
            })

            user_id = created.user.id if getattr(created, "user", None) else None
            if not user_id:
                raise Exception("Failed to create user")

            supabase_admin.table("user_profiles").update({
                "full_name": full_name,
                "phone": phone,
                "assigned_area": assigned_area,
                "role": role
            }).eq("id", user_id).execute()

            if role == "DOCTOR":
                await AuthService._create_doctor_entry(user_id, full_name, phone or "", assigned_area or "", email)
            elif role == "ASHA_WORKER":
                await AuthService._create_asha_worker_entry(user_id, full_name, phone or "", assigned_area or "", email)

            supabase_admin.table("registration_requests").update({
                "status": "APPROVED",
                "reviewed_by": reviewer_id,
                "review_note": note,
                "reviewed_at": datetime.utcnow().isoformat()
            }).eq("id", request_id).execute()

            return {
                "id": user_id,
                "email": email,
                "role": role,
                "full_name": full_name
            }
        except Exception as e:
            logger.error(f"❌ Approve registration request error: {e}")
            raise

    @staticmethod
    async def reject_registration_request(request_id: int, reviewer_id: str, note: Optional[str] = None) -> None:
        try:
            supabase_admin.table("registration_requests").update({
                "status": "REJECTED",
                "reviewed_by": reviewer_id,
                "review_note": note,
                "reviewed_at": datetime.utcnow().isoformat()
            }).eq("id", request_id).execute()
        except Exception as e:
            logger.error(f"❌ Reject registration request error: {e}")
            raise
    
    @staticmethod
    async def _create_doctor_entry(user_id: str, name: str, phone: str, assigned_area: str, email: str):
        """Create or update doctor entry"""
        try:
            supabase_admin.table("doctors").insert({
                "user_profile_id": user_id,
                "name": name,
                "phone": phone,
                "assigned_area": assigned_area,
                "email": email,
                "is_active": True
            }).execute()
        except Exception as e:
            logger.warning(f"Could not create doctor entry: {e}")
    
    @staticmethod
    async def _create_asha_worker_entry(user_id: str, name: str, phone: str, assigned_area: str, email: str):
        """Create or update ASHA worker entry"""
        try:
            supabase_admin.table("asha_workers").insert({
                "user_profile_id": user_id,
                "name": name,
                "phone": phone,
                "assigned_area": assigned_area,
                "email": email,
                "is_active": True
            }).execute()
        except Exception as e:
            logger.warning(f"Could not create ASHA worker entry: {e}")
    
    @staticmethod
    async def sign_in(email: str, password: str) -> Dict[str, Any]:
        """
        Sign in user with email and password
        
        Args:
            email: User's email
            password: User's password
            
        Returns:
            Dict containing user data and session
        """
        try:
            response = supabase_client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.user:
                # Get user profile
                profile = supabase_client.table("user_profiles").select("*").eq(
                    "id", response.user.id
                ).execute()
                
                profile_data = profile.data[0] if profile.data else {}
                
                logger.info(f"✅ User signed in: {email} ({profile_data.get('role')})")
                
                return {
                    "success": True,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "role": profile_data.get("role"),
                        "full_name": profile_data.get("full_name"),
                        "phone": profile_data.get("phone"),
                        "assigned_area": profile_data.get("assigned_area"),
                        "is_active": profile_data.get("is_active", True)
                    },
                    "session": {
                        "access_token": response.session.access_token,
                        "refresh_token": response.session.refresh_token,
                        "expires_at": response.session.expires_at
                    } if response.session else None
                }
            else:
                raise Exception("Sign in failed - no user returned")
                
        except Exception as e:
            logger.error(f"❌ Sign in error: {e}")
            raise Exception(f"Sign in failed: {str(e)}")
    
    @staticmethod
    async def sign_in_with_google() -> Dict[str, Any]:
        """
        Sign in with Google OAuth
        Returns the OAuth URL for redirection
        """
        try:
            response = supabase_client.auth.sign_in_with_oauth({
                "provider": "google",
                "options": {
                    "redirect_to": os.getenv("OAUTH_REDIRECT_URL", "http://localhost:5173/auth/callback")
                }
            })
            
            return {
                "success": True,
                "url": response.url,
                "provider": response.provider
            }
            
        except Exception as e:
            logger.error(f"❌ Google OAuth error: {e}")
            raise Exception(f"Google OAuth failed: {str(e)}")
    
    @staticmethod
    async def sign_out(access_token: str) -> Dict[str, Any]:
        """
        Sign out user
        
        Args:
            access_token: User's access token
            
        Returns:
            Success status
        """
        try:
            # Create client with user's token
            user_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            user_client.auth.set_session(access_token, None)
            
            response = user_client.auth.sign_out()
            
            logger.info("✅ User signed out successfully")
            
            return {
                "success": True,
                "message": "Signed out successfully"
            }
            
        except Exception as e:
            logger.error(f"❌ Sign out error: {e}")
            raise Exception(f"Sign out failed: {str(e)}")
    
    @staticmethod
    async def get_user(access_token: str) -> Dict[str, Any]:
        """
        Get current user from access token
        
        Args:
            access_token: JWT access token
            
        Returns:
            User data
        """
        try:
            # Verify token and get user
            user_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            user_client.auth.set_session(access_token, None)
            
            response = user_client.auth.get_user()
            
            if response.user:
                # Get user profile
                profile = supabase_client.table("user_profiles").select("*").eq(
                    "id", response.user.id
                ).execute()
                
                profile_data = profile.data[0] if profile.data else {}
                
                return {
                    "success": True,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "role": profile_data.get("role"),
                        "full_name": profile_data.get("full_name"),
                        "phone": profile_data.get("phone"),
                        "assigned_area": profile_data.get("assigned_area"),
                        "is_active": profile_data.get("is_active", True),
                        "avatar_url": profile_data.get("avatar_url")
                    }
                }
            else:
                raise Exception("User not found")
                
        except Exception as e:
            logger.error(f"❌ Get user error: {e}")
            raise Exception(f"Failed to get user: {str(e)}")
    
    @staticmethod
    async def refresh_session(refresh_token: str) -> Dict[str, Any]:
        """
        Refresh user session
        
        Args:
            refresh_token: Refresh token
            
        Returns:
            New session data
        """
        try:
            response = supabase_client.auth.refresh_session(refresh_token)
            
            if response.session:
                return {
                    "success": True,
                    "session": {
                        "access_token": response.session.access_token,
                        "refresh_token": response.session.refresh_token,
                        "expires_at": response.session.expires_at
                    }
                }
            else:
                raise Exception("Session refresh failed")
                
        except Exception as e:
            logger.error(f"❌ Session refresh error: {e}")
            raise Exception(f"Session refresh failed: {str(e)}")
    
    @staticmethod
    async def update_profile(
        user_id: str,
        full_name: Optional[str] = None,
        phone: Optional[str] = None,
        assigned_area: Optional[str] = None,
        avatar_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update user profile
        
        Args:
            user_id: User ID
            full_name: Optional new full name
            phone: Optional new phone
            assigned_area: Optional new assigned area
            avatar_url: Optional new avatar URL
            
        Returns:
            Updated profile data
        """
        try:
            update_data = {}
            if full_name:
                update_data["full_name"] = full_name
            if phone:
                update_data["phone"] = phone
            if assigned_area:
                update_data["assigned_area"] = assigned_area
            if avatar_url:
                update_data["avatar_url"] = avatar_url
            
            if update_data:
                response = supabase_admin.table("user_profiles").update(update_data).eq(
                    "id", user_id
                ).execute()
                
                logger.info(f"✅ Profile updated for user {user_id}")
                
                return {
                    "success": True,
                    "profile": response.data[0] if response.data else {}
                }
            else:
                return {
                    "success": True,
                    "message": "No changes to update"
                }
                
        except Exception as e:
            logger.error(f"❌ Profile update error: {e}")
            raise Exception(f"Profile update failed: {str(e)}")
    
    @staticmethod
    async def get_users_by_role(role: str, assigned_area: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all users by role
        
        Args:
            role: User role (ADMIN, DOCTOR, ASHA_WORKER)
            assigned_area: Optional filter by assigned area
            
        Returns:
            List of users
        """
        try:
            query = supabase_client.table("user_profiles").select("*").eq("role", role)
            
            if assigned_area:
                query = query.eq("assigned_area", assigned_area)
            
            response = query.execute()
            
            return response.data or []
            
        except Exception as e:
            logger.error(f"❌ Get users by role error: {e}")
            return []
    
    @staticmethod
    async def verify_role(user_id: str, allowed_roles: List[str]) -> bool:
        """
        Verify if user has one of the allowed roles
        
        Args:
            user_id: User ID
            allowed_roles: List of allowed roles
            
        Returns:
            True if user has allowed role, False otherwise
        """
        try:
            response = supabase_client.table("user_profiles").select("role").eq(
                "id", user_id
            ).execute()
            
            if response.data:
                user_role = response.data[0].get("role")
                return user_role in allowed_roles
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Verify role error: {e}")
            return False


# Create singleton instance
auth_service = AuthService()
