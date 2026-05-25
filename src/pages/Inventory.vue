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
                
                <q-select v-model="newItem.packType" :options="['Box', 'Packet']" label="PACK SIZE (Box or Packet)" outlined dense class="bg-white/50 font-bold text-black" required />
                
                <div class="flex gap-2">
                  <q-input v-model.number="newItem.eaWeight" type="number" step="0.001" label="1 EA Weight" outlined dense class="flex-grow bg-white/50 font-bold text-black" required />
                  <q-select v-model="newItem.eaWeightUnit" :options="['Grams', 'Kilograms']" label="Unit" outlined dense class="w-32 bg-white/50 font-bold text-black" required />
                </div>
                
                <div class="col-span-1 md:col-span-2 mt-4">
                  <q-btn type="submit" color="black" icon="save" label="Save Item to Database" size="lg" class="w-full shadow-lg rounded-xl transition hover:scale-[1.01] font-bold" />
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

          <template v-slot:body-cell-packType="props">
            <q-td :props="props" class="font-bold text-black">
              {{ props.row.packType }}
            </q-td>
          </template>

          <template v-slot:body-cell-eaWeight="props">
            <q-td :props="props" class="font-bold text-red-900">
              {{ props.row.eaWeight }} {{ props.row.eaWeightUnit }}
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
              <q-input v-model="editItem.barcode" label="Barcode" outlined dense disable class="bg-gray-100 font-bold text-black" />
              <q-input v-model="editItem.sku" label="SKU" outlined dense required class="font-bold text-black" />
              <q-input v-model="editItem.supplierName" label="Supplier Name" outlined dense required class="font-bold text-black" />
              <q-input v-model="editItem.supplierCode" label="Supplier Code" outlined dense required class="font-bold text-black" />
              <q-select v-model="editItem.packType" :options="['Box', 'Packet']" label="PACK SIZE" outlined dense required class="font-bold text-black" />
              <div class="flex gap-2">
                <q-input v-model.number="editItem.eaWeight" type="number" step="0.001" label="1 EA Weight" outlined dense class="flex-grow font-bold text-black" required />
                <q-select v-model="editItem.eaWeightUnit" :options="['Grams', 'Kilograms']" label="Unit" outlined dense class="w-32 font-bold text-black" required />
              </div>
              <q-btn type="submit" color="black" label="Save Changes" class="w-full shadow-lg rounded-xl mt-4 font-bold" />
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
import { supabase } from '../supabase'

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
  packType: 'Box',
  eaWeight: null,
  eaWeightUnit: 'Grams'
})

const columns = [
  { name: 'barcode', align: 'left', label: 'Barcode', field: 'barcode', sortable: true },
  { name: 'sku', align: 'left', label: 'SKU', field: 'sku', sortable: true },
  { name: 'supplierName', align: 'left', label: 'Supplier', field: 'supplierName', sortable: true },
  { name: 'packType', align: 'center', label: 'Pack Size', field: 'packType' },
  { name: 'eaWeight', align: 'center', label: '1 EA Weight', field: 'eaWeight', sortable: true },
  { name: 'actions', align: 'center', label: 'Actions', field: 'actions' }
]

onMounted(() => {
  fetchInventory()
})

const fetchInventory = async () => {
  const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false })
  if (!error && data) {
    inventory.value = data
  }
}

const addInventoryItem = async () => {
  if (newItem.value.barcode && newItem.value.sku) {
    if (inventory.value.find(i => i.barcode === newItem.value.barcode)) {
      $q.notify({ color: 'warning', message: 'Barcode already exists!' })
      return
    }
    
    const { error } = await supabase.from('inventory').insert([{ ...newItem.value }])
    
    if (error) {
      $q.notify({ color: 'negative', message: 'Failed to add item' })
      return
    }
    
    newItem.value = {
      supplierName: '', supplierCode: '', barcode: '', sku: '',
      packType: 'Box', eaWeight: null, eaWeightUnit: 'Grams'
    }
    $q.notify({ color: 'positive', message: 'Item Saved', icon: 'check_circle' })
    fetchInventory()
  }
}

const removeItem = async (barcode) => {
  const { error } = await supabase.from('inventory').delete().eq('barcode', barcode)
  if (!error) {
    $q.notify({ color: 'info', message: 'Item Deleted' })
    fetchInventory()
  }
}

const deleteSelected = async () => {
  const barcodesToDelete = selectedItems.value.map(i => i.barcode)
  if (barcodesToDelete.length > 0) {
    await supabase.from('inventory').delete().in('barcode', barcodesToDelete)
    selectedItems.value = []
    $q.notify({ color: 'positive', message: 'Selected Items Deleted' })
    fetchInventory()
  }
}

const openEditDialog = (item) => {
  editItem.value = { ...item }
  showEditDialog.value = true
}

const saveEdit = async () => {
  const { error } = await supabase.from('inventory')
    .update({ ...editItem.value })
    .eq('barcode', editItem.value.barcode)
    
  if (!error) {
    showEditDialog.value = false
    $q.notify({ color: 'positive', message: 'Item Updated' })
    fetchInventory()
  } else {
    $q.notify({ color: 'negative', message: 'Failed to update item' })
  }
}

const handleCsvUpload = (file) => {
  if (!file) return
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      let addedCount = 0
      const itemsToInsert = []
      
      results.data.forEach(row => {
        const barcode = row['Item code'] || row['Barcode'] || row['Item code(BARCODE)'] || Object.values(row)[2]
        
        if (barcode && !inventory.value.find(i => i.barcode === barcode)) {
          itemsToInsert.push({
            supplierName: row['Supplier Name'] || Object.values(row)[0] || '',
            supplierCode: row['Supplier code'] || Object.values(row)[1] || '',
            barcode: barcode,
            sku: row['SKU'] || Object.values(row)[3] || '',
            packType: row['Pack Type'] || row['PACK SIZE'] || 'Box',
            eaWeight: parseFloat(row['1 EA Weight'] || row['Weight']) || 0,
            eaWeightUnit: row['Weight Unit'] || row['Unit'] || 'Grams'
          })
          addedCount++
        }
      })
      
      if (itemsToInsert.length > 0) {
        await supabase.from('inventory').insert(itemsToInsert)
        fetchInventory()
      }
      
      $q.notify({ color: 'positive', message: `${addedCount} items registered` })
      csvFile.value = null
    }
  })
}
</script>
