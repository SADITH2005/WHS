<template>
  <q-page class="q-pa-md bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
    <div class="max-w-2xl mx-auto space-y-6">
      
      <q-card class="shadow-2xl rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl">
        <q-card-section class="bg-gradient-to-r from-orange-600 to-red-800 text-white rounded-t-2xl q-pa-sm flex justify-center items-center gap-2">
          <q-icon name="local_shipping" size="sm" />
          <div class="text-subtitle1 font-bold">Dispatch Verification (Collector)</div>
        </q-card-section>
        
        <q-card-section class="q-pa-md space-y-6">
          
          <!-- Step 1: Scan Box (Branch Code) -->
          <div v-if="!activeOrders.length" class="space-y-4">
            <div class="bg-orange-50 text-orange-900 p-4 rounded-xl border border-orange-200 font-bold">
              Step 1: Scan the Branch Barcode on the packed box.
            </div>
            <q-form @submit.prevent="findOrdersByBranch">
              <q-input 
                v-model="searchBranchCode" 
                label="Scan Box Barcode (Branch Code)" 
                outlined 
                dense 
                autofocus
                class="bg-white border-gray-200 text-lg"
              >
                <template v-slot:prepend><q-icon name="qr_code_scanner" color="orange-8" /></template>
              </q-input>
              <q-btn type="submit" color="orange-9" label="Locate Destination" class="w-full shadow-lg rounded-xl h-12 text-lg font-bold mt-4" />
            </q-form>
          </div>

          <!-- Step 2: Scan Gate QR -->
          <div v-else class="space-y-6">
            
            <q-card class="bg-gray-800 text-white shadow-xl rounded-xl border-l-8 border-orange-500 relative overflow-hidden">
              <q-card-section class="q-pa-md">
                <div class="text-gray-400 text-sm font-bold uppercase tracking-widest">Target Branch</div>
                <div class="text-3xl font-black mt-1">{{ targetBranchCode }}</div>
                <div class="mt-4 flex items-center justify-between">
                  <div class="text-lg font-bold px-3 py-1 bg-white/20 rounded-lg">Orders Ready: {{ activeOrders.length }}</div>
                </div>
              </q-card-section>
              <q-icon name="route" class="absolute -right-4 -bottom-4 opacity-10" size="120px" />
            </q-card>

            <div class="bg-blue-50 text-blue-900 p-4 rounded-xl border border-blue-200 font-bold flex items-center gap-3">
              <q-icon name="directions_walk" size="md" color="blue-8" />
              Proceed to Vehicle / Gate for Branch: <span class="text-xl text-blue-700 bg-white px-2 py-1 rounded shadow-sm border border-blue-100 ml-2">{{ targetBranchCode }}</span>
            </div>

            <q-form @submit.prevent="verifyGate">
              <div class="font-bold text-gray-700 mb-2">Step 2: Scan Gate QR to Verify Loading</div>
              <q-input 
                v-model="gateQr" 
                label="Scan Gate QR Code" 
                outlined 
                dense 
                autofocus
                :class="errorPulse ? 'bg-red-50 border-red-500' : 'bg-white'"
              >
                <template v-slot:prepend><q-icon name="crop_free" color="black" /></template>
              </q-input>

              <div class="flex gap-4 mt-6">
                <q-btn flat color="grey-8" label="Cancel" @click="resetAll" class="rounded-xl font-bold bg-gray-100 flex-grow" />
                <q-btn type="submit" color="positive" icon="done_all" label="Verify & Load" class="shadow-lg rounded-xl flex-grow font-bold" />
              </div>
            </q-form>

          </div>

        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const searchBranchCode = ref('')
const gateQr = ref('')
const activeOrders = ref([])
const targetBranchCode = ref('')
const errorPulse = ref(false)

const findOrdersByBranch = () => {
  if (!searchBranchCode.value) return
  
  const storedOrders = localStorage.getItem('orders_db')
  const orders = storedOrders ? JSON.parse(storedOrders) : []
  
  // Find all packed orders for this exact branch code
  const foundPacked = orders.filter(o => o.branchCode === searchBranchCode.value && o.status.includes('Packed'))
  
  if (foundPacked.length === 0) {
    $q.notify({ color: 'warning', message: 'No packed orders found ready for this branch!', position: 'top' })
    return
  }
  
  activeOrders.value = foundPacked
  targetBranchCode.value = searchBranchCode.value
  searchBranchCode.value = ''
  gateQr.value = ''
  errorPulse.value = false
}

const verifyGate = () => {
  if (!gateQr.value) return

  if (gateQr.value !== targetBranchCode.value) {
    errorPulse.value = true
    $q.notify({ 
      color: 'negative', 
      message: 'WRONG GATE / VEHICLE! This box belongs to ' + targetBranchCode.value, 
      icon: 'warning',
      position: 'center',
      timeout: 3000
    })
    
    setTimeout(() => { errorPulse.value = false }, 1000)
    gateQr.value = ''
    return
  }

  // Match! Load all packed orders for this branch.
  const storedOrders = localStorage.getItem('orders_db')
  const orders = storedOrders ? JSON.parse(storedOrders) : []
  
  // Update status for all matching invoices
  let countUpdated = 0
  activeOrders.value.forEach(activeOrd => {
    const idx = orders.findIndex(o => o.invoiceId === activeOrd.invoiceId)
    if (idx > -1) {
      orders[idx].status = 'Collected'
      countUpdated++
    }
  })
  
  localStorage.setItem('orders_db', JSON.stringify(orders))
  
  $q.notify({ 
    color: 'positive', 
    message: `Verified! ${countUpdated} Orders Loaded Successfully.`, 
    icon: 'check_circle', 
    position: 'top', 
    timeout: 3000 
  })
  resetAll()
}

const resetAll = () => {
  activeOrders.value = []
  targetBranchCode.value = ''
  searchBranchCode.value = ''
  gateQr.value = ''
  errorPulse.value = false
}
</script>
