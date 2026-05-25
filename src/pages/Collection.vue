<template>
  <q-page class="q-pa-md bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
    <div class="max-w-2xl mx-auto space-y-6">
      
      <q-card class="shadow-2xl rounded-2xl border-2 border-black bg-white">
        <q-card-section class="bg-black text-white rounded-t-xl q-pa-sm flex justify-center items-center gap-2">
          <q-icon name="local_shipping" size="sm" />
          <div class="text-subtitle1 font-black uppercase">Dispatch Verification (Collector)</div>
        </q-card-section>
        
        <q-card-section class="q-pa-md space-y-6">
          
          <!-- Step 1: Scan Box (Branch Code) -->
          <div v-if="!activeOrders.length" class="space-y-4">
            <div class="p-4 rounded-xl border-2 border-black font-black text-black text-lg bg-gray-100">
              Step 1: Scan the Branch Barcode on the packed box.
            </div>
            <q-form @submit.prevent="findOrdersByBranch">
              <q-input 
                v-model="searchBranchCode" 
                label="Scan Box Barcode (Branch Code)" 
                outlined 
                dense 
                autofocus
                class="bg-white font-bold text-black text-lg"
              >
                <template v-slot:prepend><q-icon name="qr_code_scanner" color="black" /></template>
              </q-input>
              <q-btn type="submit" color="black" label="Locate Destination" class="w-full shadow-lg rounded-xl h-12 text-lg font-black mt-4" />
            </q-form>
          </div>

          <!-- Step 2: Scan Gate QR -->
          <div v-else class="space-y-6">
            
            <q-card class="bg-white text-black shadow-xl rounded-xl border-4 border-black relative overflow-hidden">
              <q-card-section class="q-pa-md">
                <div class="text-black text-sm font-black uppercase tracking-widest">Target Branch</div>
                <div class="text-3xl font-black mt-1">{{ targetBranchCode }} - {{ targetBranchName }}</div>
                <div class="mt-4 flex items-center justify-between">
                  <div class="text-lg font-black px-3 py-1 bg-gray-200 border border-black rounded-lg">Orders Ready: {{ activeOrders.length }}</div>
                </div>
              </q-card-section>
              <q-icon name="route" class="absolute -right-4 -bottom-4 opacity-10" size="120px" />
            </q-card>

            <div class="bg-gray-100 text-black p-4 rounded-xl border-2 border-black font-black flex items-center gap-3">
              <q-icon name="directions_walk" size="md" color="black" />
              Proceed to Gate for Branch: <span class="text-xl text-black bg-white px-2 py-1 rounded shadow-sm border border-black ml-2">{{ targetBranchCode }}</span>
            </div>

            <q-form @submit.prevent="verifyGate">
              <div class="font-black text-black text-lg mb-2">Step 2: Scan Gate QR to Verify Loading</div>
              <q-input 
                v-model="gateQr" 
                label="Scan Gate QR Code" 
                outlined 
                dense 
                autofocus
                :class="errorPulse ? 'bg-red-200 border-2 border-red-800' : 'bg-white font-bold text-black'"
              >
                <template v-slot:prepend><q-icon name="crop_free" color="black" /></template>
              </q-input>

              <div class="flex gap-4 mt-6">
                <q-btn flat color="black" label="Cancel" @click="resetAll" class="rounded-xl font-bold bg-gray-200 border border-black flex-grow" />
                <q-btn type="submit" color="black" icon="done_all" label="Verify & Load" class="shadow-lg rounded-xl flex-grow font-black" />
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
import { supabase } from '../supabase'

const $q = useQuasar()

const searchBranchCode = ref('')
const gateQr = ref('')
const activeOrders = ref([])
const targetBranchCode = ref('')
const targetBranchName = ref('')
const errorPulse = ref(false)

const findOrdersByBranch = async () => {
  if (!searchBranchCode.value) return
  
  const { data, error } = await supabase.from('orders')
    .select('*')
    .eq('branchCode', searchBranchCode.value)
    .ilike('status', 'Packed%')
    
  if (error || !data || data.length === 0) {
    $q.notify({ color: 'warning', message: 'No packed orders found ready for this branch!', position: 'top' })
    return
  }
  
  activeOrders.value = data
  targetBranchCode.value = searchBranchCode.value
  targetBranchName.value = data[0].branchName || ''
  searchBranchCode.value = ''
  gateQr.value = ''
  errorPulse.value = false
}

const verifyGate = async () => {
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
  const invoiceIds = activeOrders.value.map(o => o.invoiceId)
  
  const { error } = await supabase.from('orders')
    .update({ status: 'Collected' })
    .in('invoiceId', invoiceIds)
    
  if (error) {
    $q.notify({ color: 'negative', message: 'Failed to update orders' })
    return
  }
  
  $q.notify({ 
    color: 'positive', 
    message: `Verified! ${invoiceIds.length} Orders Loaded Successfully.`, 
    icon: 'check_circle', 
    position: 'top', 
    timeout: 3000 
  })
  resetAll()
}

const resetAll = () => {
  activeOrders.value = []
  targetBranchCode.value = ''
  targetBranchName.value = ''
  searchBranchCode.value = ''
  gateQr.value = ''
  errorPulse.value = false
}
</script>
