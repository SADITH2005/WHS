<template>
  <q-page class="q-pa-md bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
    <div class="max-w-xl mx-auto space-y-6">
      
      <!-- Step 1: Initialize Invoice Section -->
      <q-card class="shadow-2xl rounded-2xl border-2 border-black bg-white">
        <q-card-section class="bg-black text-white rounded-t-xl q-pa-sm flex flex-col sm:flex-row justify-center items-center gap-2">
          <q-icon name="note_add" />
          <div class="text-subtitle1 font-black uppercase">1. Create Invoice / Pick List</div>
        </q-card-section>
        
        <q-card-section class="q-pa-md space-y-4">
          <q-input 
            v-model="invoiceId" 
            label="Pick List Barcode (ID)" 
            outlined 
            dense 
            autofocus
            :disable="isListInitialized"
            class="bg-gray-100 border-2 border-black font-black text-black text-lg"
          >
            <template v-slot:prepend><q-icon name="qr_code" color="black" /></template>
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
            class="bg-gray-100 font-black text-black text-lg border-2 border-black"
          >
            <template v-slot:prepend><q-icon name="store" color="black" /></template>
          </q-select>

          <q-input 
            v-model="date" 
            label="Date" 
            outlined 
            dense 
            type="date"
            :disable="isListInitialized"
            class="bg-gray-100 font-black text-black border-2 border-black"
          />

          <q-btn 
            v-if="!isListInitialized"
            color="black" 
            label="Start Creating Invoice" 
            class="w-full shadow-lg rounded-xl h-12 text-lg font-black mt-2" 
            @click="initializeList" 
          />
          
          <q-btn 
            v-if="isListInitialized"
            color="black" 
            flat
            label="Reset Pick List" 
            class="w-full rounded-xl font-bold bg-gray-200 border-2 border-black" 
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
          class="w-full shadow-2xl rounded-2xl h-16 text-xl font-black animate-pulse border-2 border-black"
          @click="showAddModal = true"
        />

        <q-card class="shadow-2xl rounded-2xl overflow-hidden border-2 border-black bg-white">
          <q-card-section class="bg-black text-white rounded-t-xl q-pa-sm flex justify-between items-center">
            <div class="text-subtitle2 font-black flex items-center gap-2">
              <q-icon name="list_alt" />
              Invoice Items ({{ items.length }})
            </div>
            <q-btn v-if="items.length > 0" color="black" label="Save Invoice" class="shadow-md font-bold bg-gray-200 text-black border border-black" @click="submitOrder" />
          </q-card-section>
          
          <q-list separator class="bg-transparent border-t border-black">
            <q-item v-for="item in items" :key="item.id" class="q-pa-sm hover:bg-gray-200 transition">
              <q-item-section avatar>
                <q-avatar color="black" text-color="white" icon="inventory_2" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="font-black text-black text-lg">{{ item.name }}</q-item-label>
                <q-item-label caption class="text-black font-bold">SKU: {{ item.sku }} | Weight: {{ item.weight }}kg</q-item-label>
                
                <q-item-label class="mt-1 font-black text-black bg-yellow-300 border border-black px-2 py-1 rounded inline-block w-max text-md">
                  Required: {{ formatDisplayQuantity(item.qtyInEA, item.eaPerCase) }}
                </q-item-label>
              </q-item-section>
              
              <q-item-section side>
                <q-btn flat round color="black" icon="delete" @click="removeItem(item.id)" class="hover:bg-red-200 font-bold" />
              </q-item-section>
            </q-item>
            
            <q-item v-if="items.length === 0" class="q-pa-md flex justify-center text-black font-black italic">
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
                    class="bg-gray-100 border-2 border-black font-black text-black text-lg"
                  >
                    <template v-slot:prepend><q-icon name="qr_code_scanner" color="black" /></template>
                  </q-input>
                  
                  <q-input v-model="newItem.name" label="Item Name" outlined dense required class="bg-white font-bold text-black" />
                  
                  <div class="grid grid-cols-2 gap-2">
                    <q-input v-model="newItem.sku" label="SKU" outlined dense class="bg-white font-bold text-black" />
                    <q-input v-model="newItem.weight" label="Item Weight" outlined dense class="bg-white font-bold text-black" />
                  </div>
                  
                  <div class="flex gap-2">
                    <q-input v-model.number="newItem.inputQty" label="Quantity" type="number" outlined dense required class="flex-grow bg-white font-bold text-black" />
                    <q-select v-model="newItem.uom" :options="['EA', 'CS']" label="UOM" outlined dense class="w-24 bg-white font-bold text-black" />
                  </div>
                  
                  <q-btn type="submit" color="black" icon="add" label="Confirm Add" size="lg" class="w-full shadow-lg rounded-xl mt-2 font-black" />
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
import { supabase } from '../supabase'

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
  fetchData()
})

const fetchData = async () => {
  const { data: bData } = await supabase.from('branches').select('*')
  if (bData) branchesDb.value = bData
  
  const { data: iData } = await supabase.from('inventory').select('*')
  if (iData) inventoryDb.value = iData
}

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
    newItem.value.weight = found.eaWeight
    newItem.value.eaPerCase = 1
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
        const eaPerCase = 1
        const sku = found ? found.sku : (row['SKU'] || '')
        const weight = found ? found.eaWeight : (row['Weight'] || '')
        
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

const submitOrder = async () => {
  const branchName = branchesDb.value.find(b => b.code === branchCode.value)?.name || ''
  
  const { error } = await supabase.from('orders').insert([{
    invoiceId: invoiceId.value,
    branchCode: branchCode.value,
    branchName: branchName,
    date: date.value,
    status: 'Pending',
    items: items.value
  }])

  if (error) {
    $q.notify({ color: 'negative', message: 'Failed to create invoice' })
    return
  }

  $q.notify({ color: 'positive', message: `Invoice created successfully!`, icon: 'cloud_done', position: 'top', timeout: 3000 })
  resetAll()
}
</script>
