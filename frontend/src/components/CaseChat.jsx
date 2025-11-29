import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../services/auth.js'
import { Send, MessageCircle, AlertCircle, Loader } from 'lucide-react'

export default function CaseChat({ motherId, userRole = 'DOCTOR', userName = 'Doctor' }) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)

  const loadMessages = async () => {
    try {
      setLoading(true)
      setError('')
      const { data, error: err } = await supabase
        .from('case_discussions')
        .select('*')
        .eq('mother_id', motherId)
        .order('created_at', { ascending: true })
      
      if (err) throw err
      setMessages(data || [])
      
      // Scroll to bottom after loading
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight
        }
      }, 100)
    } catch (err) {
      setError('Failed to load messages: ' + err.message)
      console.error('Load messages error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!motherId) return
    
    loadMessages()
    
    try {
      const channel = supabase
        .channel(`case_discussions_${motherId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'case_discussions', 
          filter: `mother_id=eq.${motherId}` 
        }, payload => {
          setMessages(prev => [...prev, payload.new])
          setTimeout(() => {
            if (listRef.current) {
              listRef.current.scrollTop = listRef.current.scrollHeight
            }
          }, 50)
        })
        .subscribe()
      
      return () => {
        supabase.removeChannel(channel)
      }
    } catch (err) {
      console.error('Subscription error:', err)
    }
  }, [motherId])

  const sendMessage = async e => {
    e.preventDefault()
    if (!input.trim()) return
    
    setSending(true)
    setError('')
    
    try {
      const { error: err } = await supabase.from('case_discussions').insert({
        mother_id: motherId,
        sender_role: userRole,
        sender_name: userName,
        message: input.trim()
      })
      
      if (err) throw err
      setInput('')
    } catch (err) {
      setError('Failed to send message: ' + err.message)
      console.error('Send message error:', err)
    } finally {
      setSending(false)
    }
  }

  const getRoleColor = (role) => {
    switch(role?.toUpperCase()) {
      case 'DOCTOR': return 'bg-blue-50 border-blue-200'
      case 'ASHA': return 'bg-green-50 border-green-200'
      case 'ADMIN': return 'bg-purple-50 border-purple-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getRoleTextColor = (role) => {
    switch(role?.toUpperCase()) {
      case 'DOCTOR': return 'text-blue-700'
      case 'ASHA': return 'text-green-700'
      case 'ADMIN': return 'text-purple-700'
      default: return 'text-gray-700'
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages Container */}
      <div 
        ref={listRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-gray-600">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600 font-medium">No messages yet</p>
              <p className="text-gray-500 text-sm mt-1">Start a case discussion</p>
            </div>
          </div>
        ) : (
          messages.map(m => (
          <div key={m.id} className="animate-fade-in">
              <div className={`rounded-lg border ${getRoleColor(m.sender_role)} p-3`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${getRoleTextColor(m.sender_role)}`}>
                    {m.sender_role}
                    {m.sender_name && ` • ${m.sender_name}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-gray-900 text-sm leading-relaxed">{m.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={sendMessage} className="border-t border-gray-200 bg-white p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          />
          <button 
            type="submit" 
            disabled={sending || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
