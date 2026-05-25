<template>
  <q-layout>
    <q-page-container>
      <q-page class="bg-gradient-to-br from-red-800 to-black min-h-screen flex flex-center p-4">
        <q-card class="shadow-2xl rounded-2xl w-full max-w-md bg-white/90 backdrop-blur-xl p-4">
          <q-card-section class="text-center">
            <q-icon name="warehouse" size="4rem" color="red-8" class="q-mb-md drop-shadow-md" />
            <div class="text-h4 font-bold text-gray-900 tracking-tight">Cargill's System</div>
            <div class="text-subtitle1 text-gray-500 font-medium">Employee Login</div>
          </q-card-section>

          <q-card-section>
            <q-form @submit.prevent="handleLogin" class="space-y-5">
              <q-input 
                v-model="empId" 
                label="Employee ID" 
                outlined 
                color="red-8"
                label-color="grey-8"
                :rules="[val => !!val || 'Employee ID is required']"
              >
                <template v-slot:prepend><q-icon name="badge" color="red-7" /></template>
              </q-input>

              <q-input 
                v-model="password" 
                label="Password" 
                :type="showPassword ? 'text' : 'password'" 
                outlined 
                color="red-8"
                label-color="grey-8"
                :rules="[val => !!val || 'Password is required']"
              >
                <template v-slot:prepend><q-icon name="lock" color="red-7" /></template>
                <template v-slot:append>
                  <q-btn 
                    round 
                    dense 
                    flat 
                    :icon="showPassword ? 'visibility_off' : 'visibility'" 
                    @click="showPassword = !showPassword" 
                  />
                </template>
              </q-input>

              <q-btn 
                type="submit" 
                color="red-8" 
                label="Secure Login" 
                class="w-full h-14 text-lg font-bold shadow-lg rounded-xl transition hover:scale-[1.02]" 
              />
            </q-form>
          </q-card-section>

          <q-card-section class="text-center text-gray-400 text-xs mt-4">
            Warehouse Management System v2.0
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const router = useRouter()

const empId = ref('')
const password = ref('')
const showPassword = ref(false)
const usersDb = ref([])

onMounted(() => {
  // Check for logout success
  if (sessionStorage.getItem('loggedOut') === 'true') {
    $q.notify({ color: 'positive', message: 'Logout Successful!', icon: 'check_circle' })
    sessionStorage.removeItem('loggedOut')
  }

  // Initialize user DB
  const storedUsers = localStorage.getItem('users_db')
  if (storedUsers) {
    usersDb.value = JSON.parse(storedUsers)
  } else {
    // Seed default admin if DB is completely empty
    const defaultAdmin = {
      empId: 'admin',
      name: 'System Administrator',
      password: 'admin',
      role: 'Admin',
      status: 'Active'
    }
    usersDb.value = [defaultAdmin]
    localStorage.setItem('users_db', JSON.stringify(usersDb.value))
  }
})

const handleLogin = () => {
  const user = usersDb.value.find(u => u.empId === empId.value)

  if (!user) {
    $q.notify({ color: 'negative', message: 'Invalid Employee ID or Password', icon: 'error' })
    return
  }

  if (user.password !== password.value) {
    $q.notify({ color: 'negative', message: 'Invalid Employee ID or Password', icon: 'error' })
    return
  }

  if (user.status === 'Banned') {
    $q.notify({ color: 'negative', message: 'Your account has been banned. Contact Administrator.', icon: 'block' })
    return
  }

  // Success
  localStorage.setItem('currentUser', JSON.stringify({
    empId: user.empId,
    name: user.name,
    role: user.role
  }))
  
  $q.notify({ color: 'positive', message: `Welcome back, ${user.name}!`, icon: 'how_to_reg' })
  setTimeout(() => {
    if (user.role === 'Packer') {
      window.location.href = '/packing'
    } else if (user.role === 'Collector') {
      window.location.href = '/collection'
    } else {
      window.location.href = '/'
    }
  }, 300)
}
</script>
