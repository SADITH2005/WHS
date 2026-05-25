<template>
  <q-page class="q-pa-md bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
    <div class="max-w-5xl mx-auto space-y-8">
      
      <div class="text-h4 font-bold text-gray-800 text-center q-mb-lg drop-shadow-sm">Inventory Master Data</div>

      <!-- Add New Inventory Section -->
      <q-card class="shadow-2xl rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl">
        <q-card-section class="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-t-2xl q-pa-md">
          <div class="text-h6 font-bold flex items-center gap-2">
            <q-icon name="add_circle" size="sm" />
            Register New Item
          </div>
        </q-card-section>
        
        <q-card-section class="q-pa-md">
          <q-tabs v-model="tab" dense class="text-grey-7" active-color="red-7" indicator-color="red-7" align="justify" narrow-indicator>
            <q-tab name="manual" label="Manual Entry" icon="edit" />
            <q-tab name="csv" label="CSV Upload" icon="upload_file" />
          </q-tabs>

          <q-separator class="my-3 opacity-50" />

          <q-tab-panels v-model="tab" animated class="bg-transparent">
            <!-- Manual Entry Panel -->
            <q-tab-panel name="manual" class="px-0">
              <q-form @submit.prevent="addInventoryItem" class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <q-input v-model="newItem.supplierName" label="Supplier Name" outlined dense required class="bg-white/50" />
                <q-input v-model="newItem.supplierCode" label="Supplier Code" outlined dense required class="bg-white/50" />
                
                <q-input v-model="newItem.barcode" label="Item Code (BARCODE)" outlined dense autofocus class="bg-yellow-50 border-yellow-200" required>
                  <template v-slot:prepend><q-icon name="qr_code_scanner" color="red-7" /></template>
                </q-input>
                <q-input v-model="newItem.sku" label="SKU" outlined dense required class="bg-white/50" />
                
                <q-input v-model="newItem.boxWeight" label="Box/Pack Weight" outlined dense class="bg-white/50" />
                <q-input v-model="newItem.boxHeight" label="Box/Pack Height" outlined dense class="bg-white/50" />
                
                <q-input v-model="newItem.packSize" label="Pack Size (e.g. 500g)" outlined dense class="bg-white/50" />
                <q-input v-model.number="newItem.eaPerCase" type="number" label="Items per Case (EA)" placeholder="e.g. 24" outlined dense class="bg-white/50" required>
                  <template v-slot:append><span class="text-xs text-gray-500 font-bold">EA / CS</span></template>
                </q-input>
                
                <div class="col-span-1 md:col-span-2 mt-4">
                  <q-btn type="submit" color="red-8" icon="save" label="Save Item to Database" size="lg" class="w-full shadow-lg rounded-xl transition hover:scale-[1.01]" />
                </div>
              </q-form>
            </q-tab-panel>

            <!-- CSV Upload Panel -->
            <q-tab-panel name="csv" class="px-0 flex flex-col items-center">
              <q-file 
                v-model="csvFile" 
                label="Select CSV File for Bulk Registration" 
                outlined 
                accept=".csv"
                class="w-full max-w-md bg-white/50"
                @update:model-value="handleCsvUpload"
              >
                <template v-slot:prepend>
                  <q-icon name="cloud_upload" color="red-7" />
                </template>
              </q-file>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>

      <!-- Inventory Table -->
      <q-card class="shadow-2xl rounded-2xl overflow-hidden border border-white/40 bg-white/80 backdrop-blur-xl">
        <q-card-section class="bg-gray-800 text-white flex flex-col sm:flex-row justify-between items-center gap-2 q-pa-sm">
          <div class="font-bold text-lg"><q-icon name="inventory" /> Inventory Database</div>
          <q-btn v-if="selectedItems.length > 0" color="negative" icon="delete" label="Delete Selected" @click="deleteSelected" size="sm" />
        </q-card-section>
        
        <q-table
          :rows="inventory"
          :columns="columns"
          row-key="barcode"
          selection="multiple"
          v-model:selected="selectedItems"
          flat
          :grid="$q.screen.lt.md"
          :filter="searchQuery"
          class="bg-transparent"
          table-header-class="bg-gray-100 text-gray-700 font-bold"
        >
          <template v-slot:top-right>
            <q-input borderless dense debounce="300" v-model="searchQuery" placeholder="Search..." class="bg-white px-3 rounded-full border border-gray-300">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>

          <template v-slot:top-left>
            <q-btn 
              v-if="selectedItems.length > 0" 
              color="negative" 
              icon="delete" 
              :label="`Delete Selected (${selectedItems.length})`" 
              @click="deleteSelected"
              class="shadow-md rounded-lg"
            />
          </template>

          <template v-slot:body-cell-eaPerCase="props">
            <q-td :props="props" class="font-bold text-red-700">
              {{ props.row.eaPerCase }} EA
            </q-td>
          </template>
          
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat round color="primary" icon="edit" @click="openEditDialog(props.row)" size="sm" class="hover:bg-blue-50 transition" />
              <q-btn flat round color="negative" icon="delete" @click="removeItem(props.row.barcode)" size="sm" class="hover:bg-red-50 transition" />
            </q-td>
          </template>
        </q-table>
      </q-card>

      <!-- Edit Dialog -->
      <q-dialog v-model="showEditDialog">
        <q-card class="w-full max-w-md rounded-2xl">
          <q-card-section class="bg-gray-800 text-white rounded-t-2xl flex justify-between items-center">
            <div class="text-h6 font-bold flex items-center gap-2">
              <q-icon name="edit" />
              Edit Item
            </div>
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>
          
          <q-card-section class="q-pt-md">
            <q-form @submit.prevent="saveEdit" class="flex flex-col gap-3">
              <q-input v-model="editItem.barcode" label="Barcode" outlined dense disable class="bg-gray-100" />
              <q-input v-model="editItem.sku" label="SKU" outlined dense required />
              <q-input v-model="editItem.supplierName" label="Supplier Name" outlined dense required />
              <div class="flex gap-2">
                <q-input v-model="editItem.boxWeight" label="Box Weight" outlined dense class="flex-grow" />
                <q-input v-model.number="editItem.eaPerCase" type="number" label="EA/CS" outlined dense class="w-24" required />
              </div>
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
import Papa from 'papaparse'

const $q = useQuasar()
const tab = ref('manual')
const csvFile = ref(null)

const inventory = ref([])
const selectedItems = ref([])
const searchQuery = ref('')
const showEditDialog = ref(false)
const editItem = ref({})

const newItem = ref({
  supplierName: '',
  supplierCode: '',
  barcode: '',
  sku: '',
  boxWeight: '',
  boxHeight: '',
  packSize: '',
  eaPerCase: 1
})

const columns = [
  { name: 'barcode', align: 'left', label: 'Barcode', field: 'barcode', sortable: true },
  { name: 'sku', align: 'left', label: 'SKU', field: 'sku', sortable: true },
  { name: 'supplierName', align: 'left', label: 'Supplier', field: 'supplierName', sortable: true },
  { name: 'packSize', align: 'left', label: 'Size', field: 'packSize' },
  { name: 'eaPerCase', align: 'center', label: 'Per Case', field: 'eaPerCase', sortable: true },
  { name: 'actions', align: 'center', label: 'Actions', field: 'actions' }
]

onMounted(() => {
  const stored = localStorage.getItem('inventory_db')
  if (stored) inventory.value = JSON.parse(stored)
})

const saveToDb = () => {
  localStorage.setItem('inventory_db', JSON.stringify(inventory.value))
}

const addInventoryItem = () => {
  if (newItem.value.barcode && newItem.value.sku) {
    if (inventory.value.find(i => i.barcode === newItem.value.barcode)) {
      $q.notify({ color: 'warning', message: 'Barcode already exists!' })
      return
    }
    inventory.value.unshift({ ...newItem.value })
    saveToDb()
    
    newItem.value = {
      supplierName: '', supplierCode: '', barcode: '', sku: '',
      boxWeight: '', boxHeight: '', packSize: '', eaPerCase: 1
    }
    $q.notify({ color: 'positive', message: 'Item Saved', icon: 'check_circle' })
  }
}

const removeItem = (barcode) => {
  inventory.value = inventory.value.filter(item => item.barcode !== barcode)
  saveToDb()
  $q.notify({ color: 'info', message: 'Item Deleted' })
}

const deleteSelected = () => {
  const barcodesToDelete = selectedItems.value.map(i => i.barcode)
  inventory.value = inventory.value.filter(item => !barcodesToDelete.includes(item.barcode))
  selectedItems.value = []
  saveToDb()
  $q.notify({ color: 'positive', message: 'Selected Items Deleted' })
}

const openEditDialog = (item) => {
  editItem.value = { ...item }
  showEditDialog.value = true
}

const saveEdit = () => {
  const idx = inventory.value.findIndex(i => i.barcode === editItem.value.barcode)
  if (idx > -1) {
    inventory.value[idx] = { ...editItem.value }
    saveToDb()
    showEditDialog.value = false
    $q.notify({ color: 'positive', message: 'Item Updated' })
  }
}

const handleCsvUpload = (file) => {
  if (!file) return
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      let addedCount = 0
      results.data.forEach(row => {
        const barcode = row['Item code'] || row['Barcode'] || row['Item code(BARCODE)'] || Object.values(row)[2]
        const eaPerCase = parseInt(row['Items per Case'] || row['EA/CS'] || row['Items Per Case (EA)']) || 1
        
        if (barcode && !inventory.value.find(i => i.barcode === barcode)) {
          inventory.value.push({
            supplierName: row['Supplier Name'] || Object.values(row)[0] || '',
            supplierCode: row['Supplier code'] || Object.values(row)[1] || '',
            barcode: barcode,
            sku: row['SKU'] || Object.values(row)[3] || '',
            boxWeight: row['BOX weigh'] || row['Pack weigh'] || Object.values(row)[4] || '',
            boxHeight: row['hight'] || row['height'] || Object.values(row)[5] || '',
            packSize: row['pack size'] || Object.values(row)[6] || '',
            eaPerCase: eaPerCase
          })
          addedCount++
        }
      })
      saveToDb()
      $q.notify({ color: 'positive', message: `${addedCount} items registered` })
      csvFile.value = null
    }
  })
}
</script>
