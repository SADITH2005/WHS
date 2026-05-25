<template>
  <q-page class="q-pa-md bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
    <div class="max-w-4xl mx-auto space-y-6">
      
      <!-- Order Selection Section -->
      <q-card class="shadow-2xl rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl">
        <q-card-section class="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-t-2xl q-pa-sm flex justify-between items-center">
          <div class="text-subtitle1 font-bold flex items-center gap-2">
            <q-icon name="inventory_2" />
            Packing & Verification
          </div>
        </q-card-section>
        
        <q-card-section class="q-pa-md space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <q-select 
              v-model="selectedBranch" 
              :options="branches" 
              label="Select Branch" 
              outlined 
              dense 
              class="bg-white/50"
            />
            <q-input 
              v-model="invoiceId" 
              @blur="loadInvoice"
              @keyup.enter="loadInvoice"
              label="Scan Invoice Barcode" 
              outlined 
              dense 
              autofocus
              class="bg-yellow-50 border-yellow-200"
            >
              <template v-slot:prepend><q-icon name="qr_code_scanner" color="red-7" /></template>
            </q-input>
          </div>
          <q-btn color="red-8" label="Load Invoice" class="w-full shadow-lg rounded-xl" @click="loadInvoice" />
        </q-card-section>
      </q-card>

      <!-- Active Invoice View -->
      <div v-if="activeOrder" class="space-y-6">
        
        <!-- Packing Verification Scanner -->
        <q-card class="shadow-2xl rounded-2xl border border-white/40 bg-white/90 backdrop-blur-xl border-t-4 border-t-red-600">
          <q-card-section class="q-pa-md space-y-4">
            <div class="flex justify-between items-center">
              <div class="text-h6 font-bold text-gray-800">Verify Items for Packing</div>
              <q-btn-toggle
                v-model="packMode"
                toggle-color="red-7"
                color="white"
                text-color="gray-8"
                class="border border-gray-300 shadow-sm"
                :options="[
                  {label: 'Single Mode', value: 'single'},
                  {label: 'Multiple Mode', value: 'multiple'}
                ]"
              />
            </div>

            <!-- Single Mode -->
            <q-form v-if="packMode === 'single'" @submit.prevent="verifySingleWeight" class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-4">
              <q-input v-model="scan.barcode" label="Scan 1 Item Barcode" outlined class="bg-blue-50">
                <template v-slot:prepend><q-icon name="qr_code" color="blue" /></template>
              </q-input>
              <q-input v-model.number="scan.weight" type="number" step="0.01" label="Measured Box Weight (kg)" outlined class="bg-green-50">
                <template v-slot:prepend><q-icon name="scale" color="green" /></template>
              </q-input>
              <q-btn type="submit" color="black" label="Verify Single Match" class="md:col-span-2 shadow-lg rounded-xl h-12 text-lg font-bold" />
            </q-form>

            <!-- Multiple Mode -->
            <div v-else class="space-y-4 mt-4">
              <div class="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div class="font-bold text-blue-900 mb-2">1. Scan all loose items going into the ONE box:</div>
                <q-input 
                  v-model="multiScanBarcode" 
                  @keyup.enter="addMultiScanItem"
                  label="Scan Item Barcode (Press Enter)" 
                  outlined 
                  dense
                  class="bg-white"
                >
                  <template v-slot:append>
                    <q-btn round dense flat icon="add_circle" color="primary" @click="addMultiScanItem" />
                  </template>
                </q-input>

                <!-- List of scanned items for the box -->
                <q-list separator class="mt-3 bg-white rounded border border-gray-200" v-if="scannedMultipleItems.length > 0">
                  <q-item v-for="(item, idx) in scannedMultipleItems" :key="idx" class="q-py-xs">
                    <q-item-section>
                      <q-item-label class="font-bold">{{ item.name }}</q-item-label>
                      <q-item-label caption>Qty: {{ item.qtyInEA }} EA | Net: {{ calculateNetItemWeight(item).toFixed(2) }} kg</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn flat round dense icon="close" color="negative" @click="removeMultiScanItem(idx)" />
                    </q-item-section>
                  </q-item>
                  <q-item class="bg-gray-100 font-bold">
                    <q-item-section>Expected Total Net Weight (without box):</q-item-section>
                    <q-item-section side>{{ expectedMultipleNetWeight.toFixed(2) }} kg</q-item-section>
                  </q-item>
                </q-list>
              </div>

              <q-form @submit.prevent="verifyMultipleWeight" class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <q-input v-model.number="scan.weight" type="number" step="0.01" label="2. Measure FULL Box Weight (kg)" outlined class="bg-green-50">
                  <template v-slot:prepend><q-icon name="scale" color="green" /></template>
                </q-input>
                <q-btn type="submit" color="black" label="Verify Box Match" class="shadow-lg rounded-xl h-14 text-lg font-bold" :disable="scannedMultipleItems.length === 0" />
              </q-form>
            </div>

            <div v-if="verificationResult" :class="`p-4 rounded-xl text-center font-bold text-lg border-2 ${verificationResult.class}`">
              <q-icon :name="verificationResult.icon" size="md" class="q-mr-sm" />
              {{ verificationResult.message }}
            </div>
          </q-card-section>
        </q-card>

        <!-- Invoice Items List -->
        <q-card class="shadow-2xl rounded-2xl overflow-hidden border border-white/40 bg-white/80">
          <q-card-section class="bg-gray-800 text-white q-pa-sm flex flex-col sm:flex-row justify-between items-center gap-2">
            <div class="font-bold">Items in Invoice: {{ activeOrder.invoiceId }}</div>
            <q-btn v-if="allPacked" color="positive" label="Mark Order as Packed" @click="finishOrder" size="sm" />
          </q-card-section>
          
          <q-list separator>
            <q-item v-for="(item, idx) in activeOrder.items" :key="idx" 
                    :class="item.packStatus === 'Packed' ? 'bg-green-50' : (item.packStatus === 'Missing' ? 'bg-red-50 opacity-70' : 'bg-white')">
              <q-item-section>
                <q-item-label class="font-bold text-gray-800" :class="item.packStatus === 'Missing' ? 'line-through' : ''">{{ item.name }}</q-item-label>
                <q-item-label caption>Barcode: {{ item.barcode }} | Qty: {{ item.qtyInEA }} EA</q-item-label>
                <q-item-label class="mt-1 font-semibold text-gray-700 bg-gray-200 px-2 py-1 rounded w-max text-xs">
                  Net Wgt: {{ calculateNetItemWeight(item).toFixed(2) }} kg
                </q-item-label>
              </q-item-section>
              <q-item-section side class="flex items-center flex-row gap-2">
                <q-btn v-if="item.packStatus === 'Pending'" outline color="negative" size="sm" icon="block" label="Null" @click="markAsMissing(item)" />
                <q-icon v-if="item.packStatus === 'Packed'" name="check_circle" color="positive" size="md" />
                <q-icon v-if="item.packStatus === 'Missing'" name="cancel" color="negative" size="md" />
                <q-icon v-if="item.packStatus === 'Pending'" name="pending" color="warning" size="md" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from '../supabase'

const $q = useQuasar()
const CARDBOARD_BOX_WEIGHT = 0.5 // Standard box weight 500g

const branches = ref([])
const selectedBranch = ref('')
const invoiceId = ref('')
const activeOrder = ref(null)

const packMode = ref('single')
const scan = ref({ barcode: '', weight: null })
const verificationResult = ref(null)

// Multiple Mode State
const multiScanBarcode = ref('')
const scannedMultipleItems = ref([])

const inventoryDb = ref([])
const ordersDb = ref([])

onMounted(async () => {
  const { data: bData } = await supabase.from('branches').select('code')
  if (bData) branches.value = bData.map(b => b.code)

  const { data: iData } = await supabase.from('inventory').select('*')
  if (iData) inventoryDb.value = iData
})

watch(packMode, () => {
  verificationResult.value = null
  scan.value = { barcode: '', weight: null }
  scannedMultipleItems.value = []
  multiScanBarcode.value = ''
})

const loadInvoice = async () => {
  if (!invoiceId.value) return
  
  const { data, error } = await supabase.from('orders').select('*').eq('invoiceId', invoiceId.value)
  
  if (!error && data && data.length > 0) {
    const order = data[0]
    if (order.status === 'Packed') {
      $q.notify({ color: 'warning', message: 'Order is already marked as Packed!' })
      activeOrder.value = null
    } else {
      order.items = order.items.map(i => ({ ...i, packStatus: 'Pending' }))
      activeOrder.value = order
      selectedBranch.value = order.branchCode
      $q.notify({ color: 'positive', message: 'Invoice Loaded', position: 'top' })
    }
  } else {
    $q.notify({ color: 'negative', message: 'Invoice Not Found', position: 'top' })
  }
}

// Calculates pure net weight of the item based on Inventory data and Ordered Qty
const calculateNetItemWeight = (item) => {
  const invItem = inventoryDb.value.find(i => i.barcode === item.barcode)
  let eaPerCase = 1
  let boxWeight = 1 // default 1kg if not specified
  
  if (invItem) {
    eaPerCase = parseInt(invItem.eaPerCase) || 1
    boxWeight = parseFloat(invItem.boxWeight) || 1
  }
  
  const weightPerEA = boxWeight / eaPerCase
  return weightPerEA * item.qtyInEA
}

const verifySingleWeight = () => {
  if (!scan.value.barcode || scan.value.weight === null) return
  
  const itemInOrder = activeOrder.value.items.find(i => i.barcode === scan.value.barcode)
  
  if (!itemInOrder) {
    verificationResult.value = { message: 'ITEM NOT IN INVOICE!', class: 'bg-red-100 text-red-800 border-red-500', icon: 'error' }
    return
  }
  if (itemInOrder.packStatus === 'Packed') {
    verificationResult.value = { message: 'ITEM ALREADY PACKED!', class: 'bg-yellow-100 text-yellow-800 border-yellow-500', icon: 'warning' }
    return
  }

  // Expected = Net Weight + 1 Standard Box
  const expectedWeight = calculateNetItemWeight(itemInOrder) + CARDBOARD_BOX_WEIGHT
  const tolerance = 0.1
  const diff = Math.abs(expectedWeight - scan.value.weight)

  if (diff <= tolerance) {
    verificationResult.value = { message: 'WEIGHT MATCH - OK TO PACK', class: 'bg-green-100 text-green-800 border-green-500', icon: 'check_circle' }
    itemInOrder.packStatus = 'Packed'
  } else {
    verificationResult.value = { message: `WEIGHT MISMATCH! Expected: ${expectedWeight.toFixed(2)}kg (diff: ${diff.toFixed(2)}kg)`, class: 'bg-red-100 text-red-800 border-red-500 animate-pulse', icon: 'warning' }
  }
  scan.value = { barcode: '', weight: null }
}

// MULTIPLE MODE LOGIC
const addMultiScanItem = () => {
  if (!multiScanBarcode.value) return

  const itemInOrder = activeOrder.value.items.find(i => i.barcode === multiScanBarcode.value)
  if (!itemInOrder) {
    $q.notify({ color: 'negative', message: 'Item NOT in this invoice!' })
  } else if (itemInOrder.packStatus === 'Packed') {
    $q.notify({ color: 'warning', message: 'Item already marked as packed!' })
  } else if (scannedMultipleItems.value.find(i => i.barcode === itemInOrder.barcode)) {
    $q.notify({ color: 'info', message: 'Item already added to current box.' })
  } else {
    scannedMultipleItems.value.push(itemInOrder)
  }
  multiScanBarcode.value = ''
}

const removeMultiScanItem = (idx) => {
  scannedMultipleItems.value.splice(idx, 1)
}

const expectedMultipleNetWeight = computed(() => {
  return scannedMultipleItems.value.reduce((sum, item) => sum + calculateNetItemWeight(item), 0)
})

const verifyMultipleWeight = () => {
  if (scannedMultipleItems.value.length === 0 || scan.value.weight === null) return

  // Expected = Sum of Net Weights + 1 Standard Box
  const expectedWeight = expectedMultipleNetWeight.value + CARDBOARD_BOX_WEIGHT
  const tolerance = 0.1
  const diff = Math.abs(expectedWeight - scan.value.weight)

  if (diff <= tolerance) {
    verificationResult.value = { message: 'BOX WEIGHT MATCH - OK TO PACK ALL', class: 'bg-green-100 text-green-800 border-green-500', icon: 'check_circle' }
    // Mark all as packed
    scannedMultipleItems.value.forEach(scannedItem => {
      const itemRef = activeOrder.value.items.find(i => i.barcode === scannedItem.barcode)
      if (itemRef) itemRef.packStatus = 'Packed'
    })
    scannedMultipleItems.value = [] // Reset for next box
  } else {
    verificationResult.value = { message: `BOX WEIGHT MISMATCH! Expected: ${expectedWeight.toFixed(2)}kg (diff: ${diff.toFixed(2)}kg)`, class: 'bg-red-100 text-red-800 border-red-500 animate-pulse', icon: 'warning' }
  }
  scan.value.weight = null
}

const markAsMissing = (item) => {
  item.packStatus = 'Missing'
  $q.notify({ color: 'info', message: 'Item marked as Missing/Null' })
}

const allPacked = computed(() => {
  return activeOrder.value && activeOrder.value.items.length > 0 && activeOrder.value.items.every(i => i.packStatus === 'Packed' || i.packStatus === 'Missing')
})

const finishOrder = async () => {
  if (activeOrder.value) {
    // Check if any items were missing, we might want to attach this info
    const missingCount = activeOrder.value.items.filter(i => i.packStatus === 'Missing').length
    const finalStatus = missingCount > 0 ? 'Packed (Partial)' : 'Packed'

    // Update the item list inside the order to reflect actual shipped quantities if missing
    const finalItems = activeOrder.value.items.map(i => {
      if (i.packStatus === 'Missing') {
        i.qtyInEA = 0 // Meaning nothing was shipped
      }
      return i
    })
    
    const { error } = await supabase.from('orders')
      .update({ status: finalStatus, items: finalItems })
      .eq('invoiceId', activeOrder.value.invoiceId)
      
    if (error) {
      $q.notify({ color: 'negative', message: 'Failed to update order status' })
      return
    }
    
    $q.notify({ color: 'positive', message: `Order dispatched! ${missingCount > 0 ? '(' + missingCount + ' items missing)' : ''}`, icon: 'local_shipping' })
    activeOrder.value = null
    invoiceId.value = ''
    verificationResult.value = null
  }
}
</script>
