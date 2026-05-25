<template>
  <q-page class="q-pa-md bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
    <div class="max-w-6xl mx-auto space-y-6">
      
      <div class="text-h4 font-bold text-gray-800 text-center q-mb-lg drop-shadow-sm flex justify-center items-center gap-3">
        <q-icon name="admin_panel_settings" color="primary" />
        System Administrator Panel
      </div>

      <!-- Add New User -->
      <q-card class="shadow-2xl rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl">
        <q-card-section class="bg-gradient-to-r from-blue-800 to-blue-600 text-white rounded-t-2xl q-pa-md">
          <div class="text-h6 font-bold flex items-center gap-2">
            <q-icon name="person_add" size="sm" />
            Register New Employee
          </div>
        </q-card-section>
        
        <q-card-section class="q-pa-md">
          <q-form @submit.prevent="registerUser" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <q-input v-model="newUser.empId" label="Employee ID" outlined dense required class="bg-white" />
            <q-input v-model="newUser.name" label="Full Name" outlined dense required class="bg-white" />
            <q-input v-model="newUser.password" label="Password" type="password" outlined dense required class="bg-white" />
            <q-select 
              v-model="newUser.role" 
              :options="['Admin', 'Manager', 'Packer', 'Collector']" 
              label="Department / Role" 
              outlined 
              dense 
              required 
              class="bg-white" 
            />
            <q-btn type="submit" color="blue-8" icon="add" label="Register Employee" class="md:col-span-4 shadow-lg rounded-xl h-12" />
          </q-form>
        </q-card-section>
      </q-card>

      <!-- Manage Users Table -->
      <q-card class="shadow-2xl rounded-2xl overflow-hidden border border-white/40 bg-white/90 backdrop-blur-xl">
        <q-table
          title="Employee Management"
          :rows="users"
          :columns="columns"
          row-key="empId"
          flat
          :grid="$q.screen.lt.md"
          :filter="searchQuery"
          class="bg-transparent"
          table-header-class="bg-gray-100 text-gray-700 font-bold"
        >
          <template v-slot:top-right>
            <q-input borderless dense debounce="300" v-model="searchQuery" placeholder="Search Employees..." class="bg-white px-3 rounded-full border border-gray-300">
              <template v-slot:append><q-icon name="search" /></template>
            </q-input>
          </template>

          <template v-slot:body-cell-role="props">
            <q-td :props="props">
              <q-badge :color="getRoleColor(props.row.role)" class="font-bold text-xs px-2 py-1">{{ props.row.role }}</q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="props.row.status === 'Active' ? 'positive' : 'negative'" class="font-bold text-xs px-2 py-1">{{ props.row.status }}</q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="flex gap-2 justify-center">
              <q-btn flat round color="primary" icon="edit" size="sm" @click="openEditDialog(props.row)">
                <q-tooltip>Edit Details</q-tooltip>
              </q-btn>
              <q-btn flat round color="orange" icon="gavel" size="sm" @click="toggleBan(props.row)">
                <q-tooltip>{{ props.row.status === 'Active' ? 'Ban User' : 'Unban User' }}</q-tooltip>
              </q-btn>
              <q-btn flat round color="negative" icon="delete" size="sm" @click="deleteUser(props.row.empId)" :disable="props.row.empId === currentUser?.empId">
                <q-tooltip>Delete User</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>

      <!-- System Data Control -->
      <q-card class="shadow-2xl rounded-2xl border border-red-500 bg-red-50 backdrop-blur-xl mt-8">
        <q-card-section class="bg-red-800 text-white rounded-t-2xl q-pa-md flex items-center justify-between">
          <div class="text-h6 font-bold flex items-center gap-2">
            <q-icon name="warning" size="sm" />
            System Data Controls (Danger Zone)
          </div>
        </q-card-section>
        
        <q-card-section class="q-pa-md flex flex-col md:flex-row gap-4 justify-between items-center">
          <div class="text-gray-700">
            <strong>Backup Data:</strong> Download a full snapshot of the system (Orders, Inventory, Branches, Users).
          </div>
          <q-btn color="primary" icon="download" label="Download Backup" @click="backupData" class="shadow-md rounded-lg" />
        </q-card-section>
        
        <q-separator />

        <q-card-section class="q-pa-md flex flex-col md:flex-row gap-4 justify-between items-center bg-red-100/50">
          <div class="text-red-900">
            <strong>Wipe System Data:</strong> Permanently deletes all Orders, Inventory, and Branches. (Users are kept).
          </div>
          <q-btn color="negative" icon="delete_forever" label="WIPE ALL DATA" @click="wipeData" class="shadow-md rounded-lg" />
        </q-card-section>
      </q-card>

      <!-- Edit User Dialog -->
      <q-dialog v-model="showEditDialog">
        <q-card class="w-full max-w-sm rounded-2xl">
          <q-card-section class="bg-gray-800 text-white rounded-t-2xl flex justify-between items-center">
            <div class="text-h6 font-bold flex items-center gap-2">
              <q-icon name="manage_accounts" />
              Edit Employee
            </div>
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>
          
          <q-card-section class="q-pt-md">
            <q-form @submit.prevent="saveEdit" class="flex flex-col gap-4">
              <q-input v-model="editData.empId" label="Employee ID" outlined dense disable class="bg-gray-100 font-bold" />
              <q-input v-model="editData.name" label="Full Name" outlined dense required />
              <q-input v-model="editData.password" label="Password" type="password" outlined dense required />
              <q-select v-model="editData.role" :options="['Admin', 'Manager', 'Packer', 'Collector']" label="Role" outlined dense required />
              <q-btn type="submit" color="primary" label="Save Changes" class="w-full shadow-lg rounded-xl mt-4" />
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const users = ref([])
const currentUser = ref(null)
const searchQuery = ref('')
const showEditDialog = ref(false)
const editData = ref({})

const newUser = ref({
  empId: '',
  name: '',
  password: '',
  role: 'Packer',
  status: 'Active'
})

const columns = [
  { name: 'empId', align: 'left', label: 'Emp ID', field: 'empId', sortable: true },
  { name: 'name', align: 'left', label: 'Name', field: 'name', sortable: true },
  { name: 'role', align: 'center', label: 'Role', field: 'role', sortable: true },
  { name: 'status', align: 'center', label: 'Status', field: 'status', sortable: true },
  { name: 'actions', align: 'center', label: 'Actions', field: 'actions' }
]

onMounted(() => {
  const cUser = localStorage.getItem('currentUser')
  if (cUser) currentUser.value = JSON.parse(cUser)

  const stored = localStorage.getItem('users_db')
  if (stored) users.value = JSON.parse(stored)
})

const saveDb = () => {
  localStorage.setItem('users_db', JSON.stringify(users.value))
}

const getRoleColor = (role) => {
  const map = {
    'Admin': 'red-8',
    'Manager': 'purple-8',
    'Packer': 'green-8',
    'Collector': 'orange-8'
  }
  return map[role] || 'grey'
}

const registerUser = () => {
  if (users.value.find(u => u.empId === newUser.value.empId)) {
    $q.notify({ color: 'warning', message: 'Employee ID already exists!' })
    return
  }
  
  users.value.push({ ...newUser.value, status: 'Active' })
  saveDb()
  $q.notify({ color: 'positive', message: 'Employee Registered!' })
  
  newUser.value = { empId: '', name: '', password: '', role: 'Packer', status: 'Active' }
}

const openEditDialog = (user) => {
  editData.value = { ...user }
  showEditDialog.value = true
}

const saveEdit = () => {
  const idx = users.value.findIndex(u => u.empId === editData.value.empId)
  if (idx > -1) {
    users.value[idx] = { ...editData.value }
    saveDb()
    showEditDialog.value = false
    $q.notify({ color: 'positive', message: 'User updated successfully' })
  }
}

const toggleBan = (user) => {
  if (user.empId === currentUser.value.empId) {
    $q.notify({ color: 'negative', message: 'You cannot ban yourself!' })
    return
  }
  user.status = user.status === 'Active' ? 'Banned' : 'Active'
  saveDb()
  $q.notify({ color: 'info', message: `User is now ${user.status}` })
}

const deleteUser = (empId) => {
  if (empId === currentUser.value.empId) {
    $q.notify({ color: 'negative', message: 'You cannot delete yourself!' })
    return
  }
  users.value = users.value.filter(u => u.empId !== empId)
  saveDb()
  $q.notify({ color: 'info', message: 'User deleted' })
}

const backupData = () => {
  const data = {
    users: JSON.parse(localStorage.getItem('users_db') || '[]'),
    inventory: JSON.parse(localStorage.getItem('inventory_db') || '[]'),
    branches: JSON.parse(localStorage.getItem('branches_db') || '[]'),
    orders: JSON.parse(localStorage.getItem('orders_db') || '[]')
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `cargills_backup_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  
  URL.revokeObjectURL(url)
  $q.notify({ color: 'positive', message: 'Backup downloaded successfully' })
}

const wipeData = () => {
  $q.dialog({
    title: 'WARNING: WIPE ALL SYSTEM DATA',
    message: 'This will permanently delete ALL Inventory, Branches, and Orders. Users will be kept. Type "CONFIRM" to proceed.',
    prompt: {
      model: '',
      type: 'text'
    },
    cancel: true,
    persistent: true
  }).onOk(data => {
    if (data === 'CONFIRM') {
      localStorage.removeItem('inventory_db')
      localStorage.removeItem('branches_db')
      localStorage.removeItem('orders_db')
      $q.notify({ color: 'negative', message: 'System Data Wiped Successfully!' })
    } else {
      $q.notify({ color: 'warning', message: 'Wipe Cancelled: Incorrect confirmation text' })
    }
  })
}
</script>
