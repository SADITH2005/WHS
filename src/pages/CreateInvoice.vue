<template>
  <q-page class="q-pa-md bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
    <div class="max-w-xl mx-auto space-y-6">
      
      <!-- Step 1: Initialize Invoice Section -->
      <q-card class="shadow-2xl rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl">
        <q-card-section class="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-t-2xl q-pa-sm flex flex-col sm:flex-row justify-center items-center gap-2">
          <q-icon name="note_add" />
          <div class="text-subtitle1 font-bold">1. Create Invoice / Pick List</div>
        </q-card-section>
        
        <q-card-section class="q-pa-md space-y-4">
          <q-input 
            v-model="invoiceId" 
            label="Pick List Barcode (ID)" 
            outlined 
            dense 
            autofocus
            :disable="isListInitialized"
            class="bg-yellow-50 border-yellow-200 font-bold"
          >
            <template v-slot:prepend><q-icon name="qr_code" color="red-7" /></template>
          </q-input>
          
          <q-select 
            v-model="branchCode" 
            :options="branchOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            label="Select Branch" 
            outlined 
            dense 
            :disable="isListInitialized"
            class="bg-white/50"
          >
            <template v-slot:prepend><q-icon name="store" color="red-7" /></template>
          </q-select>

          <q-input 
            v-model="date" 
            label="Date" 
            outlined 
            dense 
            type="date"
            :disable="isListInitialized"
            class="bg-white/50"
          />

          <q-btn 
            v-if="!isListInitialized"
            color="red-8" 
            label="Start Creating Invoice" 
            class="w-full shadow-lg rounded-xl h-12 text-lg font-bold" 
            @click="initializeList" 
          />
          
          <q-btn 
            v-if="isListInitialized"
            color="grey-8" 
            flat
            label="Reset Pick List" 
            class="w-full rounded-xl" 
            @click="resetAll" 
          />
        </q-card-section>
      </q-card>

      <!-- Step 2: Items List & Add Button -->
      <div v-if="isListInitialized" class="space-y-6">
        
        <q-btn 
          color="black" 
          icon="add_circle" 
          label="ADD ITEM TO PICK LIST" 
          class="w-full shadow-2xl rounded-2xl h-16 text-xl font-bold animate-pulse"
          @click="showAddModal = true"
        />

        <q-card class="shadow-2xl rounded-2xl overflow-hidden border border-white/40 bg-white/80 backdrop-blur-xl">
          <q-card-section class="bg-gray-800 text-white rounded-t-2xl q-pa-sm flex justify-between items-center">
            <div class="text-subtitle2 font-bold flex items-center gap-2">
              <q-icon name="list_alt" />
              Invoice Items ({{ items.length }})
            </div>
            <q-btn v-if="items.length > 0" color="red-8" label="Save Invoice" size="sm" @click="submitOrder" class="shadow-md" />
          </q-card-section>
          
          <q-list separator class="bg-transparent">
            <q-item v-for="item in items" :key="item.id" class="q-pa-sm hover:bg-gray-50 transition">
              <q-item-section avatar>
                <q-avatar color="red-1" text-color="red-8" icon="inventory_2" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="font-bold text-gray-800">{{ item.name }}</q-item-label>
                <q-item-label caption class="text-gray-500">SKU: {{ item.sku }} | Weight: {{ item.weight }}kg</q-item-label>
                
                <q-item-label class="mt-1 font-bold text-red-800 bg-red-50 px-2 py-1 rounded inline-block w-max">
                  Required: {{ formatDisplayQuantity(item.qtyInEA, item.eaPerCase) }}
                </q-item-label>
              </q-item-section>
              
              <q-item-section side>
                <q-btn flat round color="negative" icon="delete" @click="removeItem(item.id)" class="hover:bg-red-50" />
              </q-item-section>
            </q-item>
            
            <q-item v-if="items.length === 0" class="q-pa-md flex justify-center text-gray-500 italic">
              No items added yet. Click 'Add Item' above.
            </q-item>
          </q-list>
        </q-card>
      </div>
      
      <!-- Add Item Modal -->
      <q-dialog v-model="showAddModal" position="bottom">
        <q-card class="w-full max-w-md rounded-t-3xl q-pb-lg">
          <q-card-section class="bg-red-700 text-white flex justify-between items-center rounded-t-3xl">
            <div class="text-h6 font-bold flex items-center gap-2">
              <q-icon name="playlist_add" />
              Add Item
            </div>
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>
          
          <q-card-section class="q-pt-md">
            <q-tabs v-model="tab" dense class="text-grey-7" active-color="red-7" indicator-color="red-7" align="justify" narrow-indicator>
              <q-tab name="manual" label="Scan/Manual" icon="qr_code_scanner" />
              <q-tab name="csv" label="CSV Upload" icon="file_upload" />
            </q-tabs>

            <q-tab-panels v-model="tab" animated class="mt-4">
              <q-tab-panel name="manual" class="px-0 py-0 space-y-4">
                <q-form @submit.prevent="addItem" class="flex flex-col gap-3">
                  <q-input 
                    v-model="newItem.barcode" 
                    @blur="lookupItemDetails"
                    @keyup.enter="lookupItemDetails"
                    label="Barcode (Scan Here)" 
                    outlined 
                    autofocus 
                    class="bg-yellow-50 border-yellow-200 font-bold"
                  >
                    <template v-slot:prepend><q-icon name="qr_code_scanner" color="red-7" /></template>
                  </q-input>
                  
                  <q-input v-model="newItem.name" label="Item Name" outlined dense required class="bg-white" />
                  
                  <div class="grid grid-cols-2 gap-2">
                    <q-input v-model="newItem.sku" label="SKU" outlined dense class="bg-white" />
                    <q-input v-model="newItem.weight" label="Item Weight" outlined dense class="bg-white" />
                  </div>
                  
                  <div class="flex gap-2">
                    <q-input v-model.number="newItem.inputQty" label="Quantity" type="number" outlined dense required class="flex-grow bg-white" />
                    <q-select v-model="newItem.uom" :options="['EA', 'CS']" label="UOM" outlined dense class="w-24 bg-white" />
                  </div>
                  
                  <div v-if="newItem.eaPerCase > 1" class="text-xs text-red-800 bg-red-50 p-2 rounded">
                    System Info: 1 Case = {{ newItem.eaPerCase }} EA
                  </div>
                  
                  <q-btn type="submit" color="black" icon="add" label="Confirm Add" size="lg" class="w-full shadow-lg rounded-xl mt-2" />
                </q-form>
              </q-tab-panel>

              <q-tab-panel name="csv" class="px-0 py-0">
                <q-file 
                  v-model="csvFile" 
                  label="Select CSV List" 
                  outlined 
                  dense 
                  accept=".csv"
                  class="w-full"
                  @update:model-value="handleCsvUpload"
                >
                  <template v-slot:prepend>
                    <q-icon name="attach_file" />
                  </template>
                </q-file>
              </q-tab-panel>
            </q-tab-panels>
          </q-card-section>
        </q-card>
      </q-dialog>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import Papa from 'papaparse'

const $q = useQuasar()

// Step 1 State
const isListInitialized = ref(false)
const invoiceId = ref('')
const branchCode = ref('')
const date = ref(new Date().toISOString().split('T')[0])

// Step 2 State
const showAddModal = ref(false)
const tab = ref('manual')
const csvFile = ref(null)

const items = ref([])
let itemIdCounter = 1

const branchesDb = ref([])
const inventoryDb = ref([])

onMounted(() => {
  const storedBranches = localStorage.getItem('branches_db')
  if (storedBranches) branchesDb.value = JSON.parse(storedBranches)

  const storedInv = localStorage.getItem('inventory_db')
  if (storedInv) inventoryDb.value = JSON.parse(storedInv)
})

const branchOptions = computed(() => {
  return branchesDb.value.map(b => ({ label: `${b.code} - ${b.name}`, value: b.code }))
})

const initializeList = () => {
  if (!invoiceId.value) {
    $q.notify({ color: 'warning', message: 'Please enter Pick List Barcode / ID' })
    return
  }
  if (!branchCode.value) {
    $q.notify({ color: 'warning', message: 'Please select a Branch' })
    return
  }
  isListInitialized.value = true
  $q.notify({ color: 'positive', message: 'Invoice Initialized. You can now add items.', icon: 'check_circle' })
}

const resetAll = () => {
  isListInitialized.value = false
  invoiceId.value = ''
  branchCode.value = ''
  items.value = []
}

// Add Item State
const newItem = ref({
  barcode: '',
  name: '',
  sku: '',
  weight: '',
  inputQty: 1,
  uom: 'EA',
  eaPerCase: 1
})

const lookupItemDetails = () => {
  if (!newItem.value.barcode) return
  
  const found = inventoryDb.value.find(i => i.barcode === newItem.value.barcode)
  if (found) {
    newItem.value.name = found.name || found.supplierName + ' ' + found.sku
    newItem.value.sku = found.sku
    newItem.value.weight = found.boxWeight || found.packWeightHeight
    newItem.value.eaPerCase = parseInt(found.eaPerCase) || 1
    $q.notify({ color: 'info', message: 'Item Auto-filled from DB', position: 'top', timeout: 1000 })
  }
}

const addItem = () => {
  if (newItem.value.name && newItem.value.inputQty) {
    let qtyInEA = newItem.value.inputQty
    if (newItem.value.uom === 'CS') {
      qtyInEA = newItem.value.inputQty * newItem.value.eaPerCase
    }

    items.value.unshift({
      id: itemIdCounter++,
      barcode: newItem.value.barcode,
      name: newItem.value.name,
      sku: newItem.value.sku,
      weight: newItem.value.weight,
      qtyInEA: qtyInEA,
      eaPerCase: newItem.value.eaPerCase
    })
    
    newItem.value = { barcode: '', name: '', sku: '', weight: '', inputQty: 1, uom: 'EA', eaPerCase: 1 }
    showAddModal.value = false
    
    $q.notify({ color: 'positive', message: 'Item Added', icon: 'check_circle', position: 'top', timeout: 1000 })
  }
}

const formatDisplayQuantity = (qtyInEA, eaPerCase) => {
  if (eaPerCase <= 1) return `${qtyInEA} EA`
  const cases = Math.floor(qtyInEA / eaPerCase)
  const looseEA = qtyInEA % eaPerCase
  if (cases > 0 && looseEA > 0) return `${cases} CS and ${looseEA} EA`
  else if (cases > 0 && looseEA === 0) return `${cases} CS`
  else return `${looseEA} EA`
}

const removeItem = (id) => {
  items.value = items.value.filter(item => item.id !== id)
}

const handleCsvUpload = (file) => {
  if (!file) return
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      let addedCount = 0
      results.data.forEach(row => {
        const barcode = row['Barcode'] || row['Item Code'] || Object.values(row)[0]
        const itemName = row['Item Name'] || row['Name'] || Object.values(row)[1]
        
        const found = inventoryDb.value.find(i => i.barcode === barcode)
        const eaPerCase = found ? (parseInt(found.eaPerCase) || 1) : 1
        const sku = found ? found.sku : (row['SKU'] || '')
        const weight = found ? found.boxWeight : (row['Weight'] || '')
        
        const rawQty = parseInt(row['Pick Qty'] || row['Qty'] || Object.values(row)[2]) || 0
        const uom = (row['UOM'] || 'EA').toUpperCase()
        
        let qtyInEA = rawQty
        if (uom === 'CS') qtyInEA = rawQty * eaPerCase
        
        if (itemName && qtyInEA > 0) {
          items.value.unshift({
            id: itemIdCounter++, barcode, name: itemName, sku, weight, qtyInEA, eaPerCase
          })
          addedCount++
        }
      })
      $q.notify({ color: 'positive', message: `${addedCount} items added from CSV`, position: 'top' })
      csvFile.value = null
      showAddModal.value = false
    }
  })
}

const submitOrder = () => {
  const storedOrders = localStorage.getItem('orders_db')
  const orders = storedOrders ? JSON.parse(storedOrders) : []
  
  const newOrder = {
    invoiceId: invoiceId.value, // Using the inputted Pick List ID as the Invoice ID
    branchCode: branchCode.value,
    date: date.value,
    status: 'Pending',
    items: [...items.value]
  }
  
  orders.push(newOrder)
  localStorage.setItem('orders_db', JSON.stringify(orders))

  $q.notify({ color: 'positive', message: `Invoice created successfully!`, icon: 'cloud_done', position: 'top', timeout: 3000 })
  resetAll()
}
</script>
