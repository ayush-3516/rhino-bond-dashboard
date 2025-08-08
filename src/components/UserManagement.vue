<script setup>
import { ref, onMounted, watchEffect } from 'vue'
import { supabase, withServiceRole, assignAgentCode } from '../supabase'
import ConfirmModal from './ConfirmModal.vue'

const props = defineProps({
  filteredUsers: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update'])

const users = ref([])
const loading = ref(false)
const showDeleteModal = ref(false)
const userToDelete = ref(null)
const copySuccess = ref(null)
const showUserDetails = ref(null)

// Watch for filtered users from parent
watchEffect(() => {
  console.log('UserManagement watchEffect triggered')
  console.log('props.filteredUsers:', props.filteredUsers?.length || 0)
  console.log('props.isLoading:', props.isLoading)
  
  // Always update users when props change
  users.value = props.filteredUsers || []
  loading.value = props.isLoading || false
  
  console.log('Updated users from props:', users.value.length)
  console.log('Updated loading from props:', loading.value)
})

// Function to copy text to clipboard
async function copyToClipboard(text, userId, type = 'User ID') {
  try {
    await navigator.clipboard.writeText(text)
    copySuccess.value = userId
    
    // Show toast notification
    const message = document.createElement('div');
    message.className = 'toast-message info';
    message.textContent = `${type} copied to clipboard`;
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.classList.add('show');
      setTimeout(() => {
        message.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(message);
          copySuccess.value = null;
        }, 300);
      }, 2000);
    }, 100);
  } catch (err) {
    console.error('Failed to copy: ', err);
    alert('Failed to copy to clipboard. Your browser may not support this feature.');
  }
}

async function fetchUsers() {
  loading.value = true
  try {
    const { data, error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .select('*, points_balance')
        .order('created_at', { ascending: false })
    })

    if (error) throw error
    users.value = data || []
  } catch (error) {
    console.error('Error fetching users:', error)
    users.value = [] // Ensure users is always an array
    
    // Show error notification
    const message = document.createElement('div')
    message.className = 'toast-message error'
    message.textContent = 'Failed to load users. Please try again.'
    document.body.appendChild(message)
    
    setTimeout(() => {
      message.classList.add('show')
      setTimeout(() => {
        message.classList.remove('show')
        setTimeout(() => {
          if (document.body.contains(message)) {
            document.body.removeChild(message)
          }
        }, 300)
      }, 3000)
    }, 100)
  } finally {
    loading.value = false
    emit('update')
  }
}

async function toggleAdminConfirmation(user) {
  try {
    const newStatus = !user.admin_confirmation;
    const { error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .update({ admin_confirmation: newStatus })
        .eq('id', user.id)
    })

    if (error) throw error
    await fetchUsers()
    
    // Show confirmation message
    const action = newStatus ? 'verified' : 'unverified';
    const message = document.createElement('div');
    message.className = 'toast-message ' + (newStatus ? 'success' : 'warning');
    message.textContent = `User ${action} successfully`;
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.classList.add('show');
      setTimeout(() => {
        message.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(message);
        }, 300);
      }, 2000);
    }, 100);
    
  } catch (error) {
    console.error('Error updating user:', error)
    alert('Failed to update user verification status: ' + error.message)
  }
}

async function promoteToAgent(user) {
  try {
    const { error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .update({ role: 'agent' })
        .eq('id', user.id)
    })

    if (error) throw error
    
    // Show promotion success message
    const message = document.createElement('div');
    message.className = 'toast-message success';
    message.textContent = 'User promoted to agent successfully';
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.classList.add('show');
      setTimeout(() => {
        message.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(message);
        }, 300);
      }, 2000);
    }, 100);
    
    // Automatically generate an agent code
    try {
      const code = await assignAgentCode(user.id);
      await fetchUsers();
      
      // Show agent code success message
      const codeMessage = document.createElement('div');
      codeMessage.className = 'toast-message info';
      codeMessage.textContent = `Agent code generated: ${code}`;
      document.body.appendChild(codeMessage);
      
      setTimeout(() => {
        codeMessage.classList.add('show');
        setTimeout(() => {
          codeMessage.classList.remove('show');
          setTimeout(() => {
            document.body.removeChild(codeMessage);
          }, 300);
        }, 2000);
      }, 2500); // Show after the first toast disappears
    } catch (codeError) {
      console.error('Failed to generate agent code:', codeError);
      // Continue anyway as the promotion was successful
    }
  } catch (error) {
    console.error('Error promoting user to agent:', error)
    alert('Failed to promote user: ' + error.message)
  }
}

async function demoteToUser(user) {
  try {
    // Always nullify agent code when demoting
    const updates = { 
      role: 'user',
      agent_code: null 
    };
    
    const { error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .update(updates)
        .eq('id', user.id)
    })

    if (error) throw error
    
    // If they had an agent code, we should deactivate it in agent_codes table
    if (user.agent_code) {
      try {
        await withServiceRole(async (client) => {
          return client
            .from('agent_codes')
            .update({ is_active: false })
            .eq('code', user.agent_code)
        })
      } catch (codeError) {
        console.error('Error deactivating agent code:', codeError)
        // Continue anyway as the user role change was successful
      }
    }
    
    await fetchUsers()
    
    // Show toast notification
    const message = document.createElement('div');
    message.className = 'toast-message info';
    message.textContent = 'User demoted to regular user successfully';
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.classList.add('show');
      setTimeout(() => {
        message.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(message);
        }, 300);
      }, 2000);
    }, 100);
  } catch (error) {
    console.error('Error demoting user:', error)
    alert('Failed to demote user: ' + error.message)
  }
}

async function handleAssignCode(user) {
  try {
    // First, check if the user is already an agent
    if (user.role !== 'agent' && user.role !== 'admin') {
      const promote = confirm('User must be an agent to have an agent code. Promote user to agent now?')
      if (promote) {
        await promoteToAgent(user)
        return // promoteToAgent will handle the rest
      } else {
        return // User chose not to proceed
      }
    }
    
    // Second, check if user already has a code
    if (user.agent_code) {
      const regenerate = confirm(`User already has agent code: ${user.agent_code}. Regenerate new code?`)
      if (!regenerate) return
      
      // Deactivate old code
      const { error: deactivateError } = await withServiceRole(async (client) => {
        return client
          .from('agent_codes')
          .update({ is_active: false })
          .eq('code', user.agent_code)
      })
      
      if (deactivateError) {
        console.error('Error deactivating old agent code:', deactivateError)
        // Continue anyway to generate new code
      }
    }
    
    const code = await assignAgentCode(user.id)
    await fetchUsers()
    
    // Show success message with copy button
    const modal = document.createElement('div');
    modal.className = 'code-modal-backdrop';
    modal.innerHTML = `
      <div class="code-modal">
        <h3>Agent Code Generated</h3>
        <div class="code-display">
          <code>${code}</code>
          <button class="copy-code-btn" data-code="${code}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>
        </div>
        <p>This code can be used by the agent to onboard new users</p>
        <div class="modal-actions">
          <button class="close-modal-btn">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.close-modal-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('.copy-code-btn').addEventListener('click', (e) => {
      const code = e.currentTarget.getAttribute('data-code');
      navigator.clipboard.writeText(code);
      e.currentTarget.textContent = 'Copied!';
      setTimeout(() => {
        e.currentTarget.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        `;
      }, 2000);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  } catch (error) {
    console.error('Error assigning agent code:', error)
    alert('Failed to assign agent code: ' + error.message)
  }
}

function confirmDelete(user) {
  userToDelete.value = user
  showDeleteModal.value = true
}

async function deleteUser() {
  const user = userToDelete.value
  showDeleteModal.value = false
  
  try {
    // Show loading indicator
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'toast-message loading';
    loadingMessage.innerHTML = `
      <div class="spinner"></div>
      <span>Deleting user...</span>
    `;
    document.body.appendChild(loadingMessage);
    loadingMessage.classList.add('show');
    
    // Clean up related data for the user
    
    // 1. Delete related points transactions
    const { error: pointsError } = await withServiceRole(async (client) => {
      return client
        .from('points_transactions')
        .delete()
        .eq('user_id', user.id)
    })

    if (pointsError) throw pointsError
    
    // 2. Check if user has agent code and deactivate if needed
    if (user.agent_code) {
      const { error: codeError } = await withServiceRole(async (client) => {
        return client
          .from('agent_codes')
          .update({ is_active: false })
          .eq('code', user.agent_code)
      })
      
      if (codeError) {
        console.error('Error deactivating agent code:', codeError)
        // Continue anyway as this isn't critical
      }
    }
    
    // 3. Check for contact messages from user
    const { data: contactMessages } = await withServiceRole(async (client) => {
      return client
        .from('contact_messages')
        .select('id')
        .eq('user_id', user.id)
    })
    
    // 4. Set user_id to null for any contact messages
    if (contactMessages && contactMessages.length > 0) {
      const { error: contactError } = await withServiceRole(async (client) => {
        return client
          .from('contact_messages')
          .update({ user_id: null })
          .eq('user_id', user.id)
      })
      
      if (contactError) {
        console.error('Error updating contact messages:', contactError)
        // Continue anyway
      }
    }

    // Finally, delete user
    const { error: userError } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .delete()
        .eq('id', user.id)
    })

    if (userError) throw userError

    // Remove loading message
    document.body.removeChild(loadingMessage);
    
    // Show success toast
    const successMessage = document.createElement('div');
    successMessage.className = 'toast-message success';
    successMessage.textContent = 'User deleted successfully';
    document.body.appendChild(successMessage);
    
    setTimeout(() => {
      successMessage.classList.add('show');
      setTimeout(() => {
        successMessage.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 300);
      }, 2000);
    }, 100);
    
    await fetchUsers()
  } catch (error) {
    console.error('Error deleting user:', error)
    
    // Remove any existing loading message
    const loadingMessage = document.querySelector('.toast-message.loading');
    if (loadingMessage) {
      document.body.removeChild(loadingMessage);
    }
    
    // Show error toast
    const errorMessage = document.createElement('div');
    errorMessage.className = 'toast-message error';
    errorMessage.textContent = 'Failed to delete user. Please try again.';
    document.body.appendChild(errorMessage);
    
    setTimeout(() => {
      errorMessage.classList.add('show');
      setTimeout(() => {
        errorMessage.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(errorMessage);
        }, 300);
      }, 3000);
    }, 100);
  }
}

// Generate user initials for avatar
function getUserInitials(name) {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Generate a color based on user ID for avatar
function getUserColor(id) {
  if (!id) return '#42b983';
  
  // Simple hash function to generate consistent color
  const hash = id.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // Generate hue from hash (0-360)
  const hue = hash % 360;
  
  // Return HSL color with fixed saturation and lightness
  return `hsl(${hue}, 70%, 65%)`;
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

// Toggle user actions menu
function toggleUserDetails(userId) {
  if (showUserDetails.value === userId) {
    showUserDetails.value = null;
  } else {
    showUserDetails.value = userId;
  }
}

// Initialize
const initialize = async () => {
  console.log('UserManagement initializing, props.filteredUsers:', props.filteredUsers?.length || 0)
  // Always use filtered users from parent if provided, even if it's an empty array
  if (props.filteredUsers !== undefined && props.filteredUsers !== null) {
    console.log('Using filtered users from parent:', props.filteredUsers.length)
    users.value = props.filteredUsers
  } else {
    console.log('No filtered users from parent, fetching users locally')
    await fetchUsers()
  }
}

onMounted(() => {
  console.log('UserManagement mounted')
  // watchEffect will handle initialization
})
</script>

<template>
  <div class="user-management">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span>Loading users...</span>
    </div>
    
    <div v-else-if="users.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="empty-icon">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      <h3>No users found</h3>
      <p>Try changing your search criteria or filters</p>
    </div>
    
    <div v-else class="users-grid">
      <div v-for="user in users" :key="user.id" class="user-card">
        <div class="card-header">
          <div class="user-avatar" :style="{ backgroundColor: getUserColor(user.id) }">
            {{ getUserInitials(user.name) }}
          </div>
          <div class="user-info">
            <h3 class="user-name">{{ user.name || 'Unnamed User' }}</h3>
            <span class="user-role" :class="user.role">{{ user.role }}</span>
          </div>
          <div class="card-actions">
            <button class="icon-button action-indicator manage-button prominent-manage" 
                    @click="toggleUserDetails(user.id)" 
                    :class="{ 'active': showUserDetails === user.id }"
                    title="Manage User">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
              <span>Manage</span>
              <span class="action-tooltip">Click to manage this user</span>
            </button>
            
            <div v-if="showUserDetails === user.id" class="action-menu">
              <!-- Confirm User Button -->
              <button
                @click="toggleAdminConfirmation(user)"
                class="menu-item"
                :class="{'confirm-item': !user.admin_confirmation, 'warning-item': user.admin_confirmation}"
              >
                <svg v-if="!user.admin_confirmation" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                {{ user.admin_confirmation ? 'Remove Verification' : 'Confirm User' }}
              </button>
              
              <!-- Role Management Buttons -->
              <button
                v-if="user.role === 'user'"
                @click="promoteToAgent(user)"
                class="menu-item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
                Promote to Agent
              </button>
              
              <button
                v-if="user.role === 'agent'"
                @click="demoteToUser(user)"
                class="menu-item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="18 9 12 15 6 9"></polyline>
                </svg>
                Demote to User
              </button>
              
              <!-- Generate Agent Code Button -->
              <button
                v-if="user.role === 'agent' && !user.agent_code"
                @click="handleAssignCode(user)"
                class="menu-item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                Generate Agent Code
              </button>
              
              <!-- Copy ID Buttons -->
              <button
                @click="copyToClipboard(user.id, user.id)"
                class="menu-item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy User ID
                <span v-if="copySuccess === user.id" class="copy-success">✓</span>
              </button>
              
              <button
                v-if="user.agent_code"
                @click="copyToClipboard(user.agent_code, user.id + '-code', 'Agent Code')"
                class="menu-item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy Agent Code
                <span v-if="copySuccess === user.id + '-code'" class="copy-success">✓</span>
              </button>
              
              <!-- Delete User Button -->
              <button
                @click="confirmDelete(user)"
                class="menu-item delete-item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete User
              </button>
            </div>
          </div>
        </div>
        
        <div class="card-body">
          <div class="user-details">
            <div class="detail-item">
              <span class="detail-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Phone:
              </span>
              <span class="detail-value">{{ user.phone || 'Not provided' }}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Email:
              </span>
              <span class="detail-value">{{ user.email || 'Not provided' }}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Joined:
              </span>
              <span class="detail-value">{{ formatDate(user.created_at) }}</span>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="status-badge" :class="{ active: user.admin_confirmation }">
              <span>{{ user.admin_confirmation ? 'Verified' : 'Unverified' }}</span>
            </div>
            
            <div class="points-badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>{{ user.points_balance || 0 }} points</span>
            </div>
            
            <div v-if="user.agent_code" class="agent-code">
              <span class="code-label">Agent Code:</span>
              <span class="code-value">
                {{ user.agent_code }}
                <button 
                  class="copy-inline-btn" 
                  title="Copy agent code"
                  @click.stop="copyToClipboard(user.agent_code, user.id + '-inline-code', 'Agent Code')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <span v-if="copySuccess === user.id + '-inline-code'" class="copy-success-inline">Copied!</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal
      :visible="showDeleteModal"
      title="Confirm Delete"
      message="Are you sure you want to delete this user? This action cannot be undone and all associated data will be permanently deleted."
      confirm-text="Delete User"
      cancel-text="Cancel"
      @confirm="deleteUser"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<style scoped>
.user-management {
  width: 100%;
}

/* Grid Layout */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-md);
  width: 100%;
}

.user-card {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Card Header */
.card-header {
  padding: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
}

.user-info {
  flex-grow: 1;
  overflow: hidden;
}

.user-name {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-role.user {
  background-color: #e9f5fe;
  color: #0066cc;
}

.user-role.agent {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.user-role.admin {
  background-color: #fff3e0;
  color: #e65100;
}

/* Card Actions */
.card-actions {
  position: relative;
}

.icon-button {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text-secondary);
  position: relative;
}

.icon-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--color-text);
}

.icon-button.action-indicator {
  background-color: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
  transition: all 0.3s ease;
}

.icon-button.action-indicator:hover {
  background-color: var(--color-primary, #42b983);
  color: white;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.icon-button.action-indicator.manage-button {
  width: auto;
  padding: 6px 12px;
  border-radius: 16px;
  background-color: rgba(66, 185, 131, 0.15);
  border-color: rgba(66, 185, 131, 0.4);
  color: var(--color-primary, #42b983);
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(66, 185, 131, 0.2);
  animation: gentle-pulse 1.5s infinite alternate;
}

@keyframes gentle-pulse {
  0% {
    box-shadow: 0 1px 3px rgba(66, 185, 131, 0.2);
    background-color: rgba(66, 185, 131, 0.15);
  }
  100% {
    box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
    background-color: rgba(66, 185, 131, 0.25);
  }
}

.icon-button.action-indicator.manage-button span {
  display: inline-block;
  font-size: 0.9rem;
  font-weight: 600;
}

.icon-button.action-indicator.manage-button:hover,
.icon-button.action-indicator.manage-button.active {
  background-color: var(--color-primary, #42b983);
  color: white;
  animation: none;
  transform: scale(1.05);
  box-shadow: 0 2px 10px rgba(66, 185, 131, 0.4);
}

.icon-button.action-indicator.prominent-manage {
  letter-spacing: 0.5px;
}

.action-tooltip {
  position: absolute;
  bottom: -30px;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  z-index: 20;
}

.icon-button:hover .action-tooltip {
  opacity: 1;
  visibility: visible;
}

.action-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 220px;
  overflow: hidden;
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text);
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  position: relative;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.menu-item::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: transparent;
  transition: background-color 0.2s ease;
}

.menu-item:hover::after {
  background-color: var(--color-primary, #42b983);
}

.menu-item.confirm-item {
  color: var(--color-primary);
}

.menu-item.warning-item {
  color: #ff9800;
}

.menu-item.delete-item {
  color: #f44336;
}

.copy-success {
  margin-left: auto;
  color: var(--color-primary);
  animation: fadeOut 2s forwards;
}

@keyframes fadeOut {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

/* Card Body */
.card-body {
  padding: var(--space-md);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.detail-value {
  font-size: 0.9rem;
  color: var(--color-text);
  word-break: break-word;
}

/* Card Footer */
.card-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  background-color: #ffecb3;
  color: #ff6f00;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.points-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background-color: #f5f5f5;
  color: var(--color-text);
}

.points-badge svg {
  color: #ffc107;
}

.agent-code {
  margin-left: auto;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.code-label {
  color: var(--color-text-secondary);
}

.code-value {
  padding: 2px 6px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.copy-inline-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  color: var(--color-text-secondary);
}

.copy-inline-btn:hover {
  opacity: 1;
}

.copy-success-inline {
  position: absolute;
  font-size: 10px;
  background-color: #42b983;
  color: white;
  padding: 2px 4px;
  border-radius: 2px;
  bottom: 100%;
  right: 0;
  white-space: nowrap;
  animation: fadeInOut 2s forwards;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(5px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; }
  100% { opacity: 0; }
}

/* Loading Container */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  gap: var(--space-md);
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #ddd;
  margin-bottom: var(--space-md);
}

.empty-state h3 {
  margin: 0;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.empty-state p {
  color: var(--color-text-secondary);
  margin: 0;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .users-grid {
    grid-template-columns: 1fr;
  }
}

/* Toast Notifications */
.toast-message {
  position: fixed;
  bottom: -100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 1rem;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: bottom 0.3s ease;
  min-width: 300px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.toast-message.show {
  bottom: 24px;
}

.toast-message.success {
  background-color: var(--color-primary, #42b983);
}

.toast-message.error {
  background-color: #f44336;
}

.toast-message.warning {
  background-color: #ff9800;
}

.toast-message.info {
  background-color: #2196f3;
}

.toast-message.loading {
  background-color: #333;
}

.toast-message .spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Code Modal */
.code-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.code-modal {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 400px;
  padding: var(--space-md);
  animation: fadeIn 0.3s ease;
}

.code-modal h3 {
  margin-top: 0;
  color: var(--color-text);
  margin-bottom: var(--space-md);
  text-align: center;
}

.code-display {
  background-color: #f5f5f5;
  border-radius: var(--border-radius);
  padding: var(--space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.code-display code {
  font-family: monospace;
  font-size: 1.2rem;
  color: var(--color-text);
  letter-spacing: 1px;
}

.copy-code-btn {
  background-color: #e0e0e0;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.copy-code-btn:hover {
  background-color: #d0d0d0;
}

.code-modal p {
  color: var(--color-text-secondary);
  text-align: center;
  margin-bottom: var(--space-md);
}

.modal-actions {
  display: flex;
  justify-content: center;
}

.close-modal-btn {
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-weight: 500;
}

.close-modal-btn:hover {
  background-color: color-mix(in srgb, var(--color-primary) 90%, black);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
