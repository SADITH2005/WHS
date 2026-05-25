<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title class="font-bold tracking-wider">
          Warehouse Mgmt System
        </q-toolbar-title>
        
        <div v-if="currentUser" class="flex items-center gap-3">
          <div class="text-right hidden sm:block">
            <div class="text-sm font-bold leading-tight">{{ currentUser.name }}</div>
            <div class="text-xs text-red-200 uppercase tracking-widest">{{ currentUser.role }}</div>
          </div>
          <q-btn flat round dense icon="account_circle">
            <q-menu>
              <q-list style="min-width: 150px">
                <q-item clickable v-close-popup @click="logout">
                  <q-item-section avatar><q-icon name="logout" color="negative" /></q-item-section>
                  <q-item-section class="text-negative font-bold">Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-1">
      <q-list class="text-gray-800 font-medium space-y-1 q-pa-md">
        <q-item-label header class="text-gray-500 font-bold uppercase tracking-widest text-xs">
          Navigation
        </q-item-label>

        <q-item clickable v-ripple to="/" active-class="bg-red-50 text-red-700 border-r-4 border-red-700" exact>
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item v-if="hasAccess(['Admin'])" clickable v-ripple to="/admin" active-class="bg-red-50 text-red-700 border-r-4 border-red-700">
          <q-item-section avatar><q-icon name="admin_panel_settings" /></q-item-section>
          <q-item-section>Admin Panel</q-item-section>
        </q-item>

        <q-item v-if="hasAccess(['Admin', 'Manager'])" clickable v-ripple to="/create-invoice" active-class="bg-red-50 text-red-700 border-r-4 border-red-700">
          <q-item-section avatar><q-icon name="note_add" /></q-item-section>
          <q-item-section>Create Invoice</q-item-section>
        </q-item>

        <q-item v-if="hasAccess(['Admin', 'Packer', 'Manager'])" clickable v-ripple to="/packing" active-class="bg-red-50 text-red-700 border-r-4 border-red-700">
          <q-item-section avatar><q-icon name="inventory_2" /></q-item-section>
          <q-item-section>Packing Verification</q-item-section>
        </q-item>

        <q-item v-if="hasAccess(['Admin', 'Collector', 'Manager'])" clickable v-ripple to="/collection" active-class="bg-red-50 text-red-700 border-r-4 border-red-700">
          <q-item-section avatar><q-icon name="local_shipping" /></q-item-section>
          <q-item-section>Dispatch / Collection</q-item-section>
        </q-item>

        <q-item v-if="hasAccess(['Admin', 'Manager'])" clickable v-ripple to="/manage-orders" active-class="bg-red-50 text-red-700 border-r-4 border-red-700">
          <q-item-section avatar><q-icon name="history" /></q-item-section>
          <q-item-section>Manage Orders</q-item-section>
        </q-item>

        <q-item v-if="hasAccess(['Admin', 'Manager'])" clickable v-ripple to="/branch" active-class="bg-red-50 text-red-700 border-r-4 border-red-700">
          <q-item-section avatar><q-icon name="store" /></q-item-section>
          <q-item-section>Branches</q-item-section>
        </q-item>

        <q-item v-if="hasAccess(['Admin', 'Manager'])" clickable v-ripple to="/analysis" active-class="bg-red-50 text-red-700 border-r-4 border-red-700">
          <q-item-section avatar><q-icon name="analytics" /></q-item-section>
          <q-item-section>Analysis</q-item-section>
        </q-item>

        <q-item v-if="hasAccess(['Admin', 'Manager'])" clickable v-ripple to="/inventory" active-class="bg-red-50 text-red-700 border-r-4 border-red-700">
          <q-item-section avatar><q-icon name="view_list" /></q-item-section>
          <q-item-section>Inventory Data</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const leftDrawerOpen = ref(false)
const currentUser = ref(null)

onMounted(() => {
  const userStr = localStorage.getItem('currentUser')
  if (userStr) {
    currentUser.value = JSON.parse(userStr)
  }
})

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const hasAccess = (allowedRoles) => {
  if (!currentUser.value) return false
  return allowedRoles.includes(currentUser.value.role)
}

const logout = () => {
  localStorage.removeItem('currentUser')
  sessionStorage.setItem('loggedOut', 'true')
  window.location.href = '/login'
}
</script>
