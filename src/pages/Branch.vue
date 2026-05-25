<template>
  <q-page class="q-pa-md bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
    <div class="max-w-5xl mx-auto space-y-6">
      <div class="text-h4 font-bold text-gray-800 text-center q-mb-lg drop-shadow-sm">Branch Management</div>

      <!-- Register Branch -->
      <q-card class="shadow-2xl rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl">
        <q-card-section class="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-t-2xl q-pa-md">
          <div class="text-h6 font-bold flex items-center gap-2">
            <q-icon name="store_mall_directory" size="sm" />
            Register New Branch
          </div>
        </q-card-section>
        
        <q-card-section class="q-pa-md">
          <q-form @submit.prevent="addBranch" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <q-input v-model="newBranch.code" label="Branch Code" outlined dense required class="bg-white/50" />
            <q-input v-model="newBranch.name" label="Branch Name" outlined dense required class="bg-white/50" />
            <q-btn type="submit" color="red-8" icon="add" label="Register" class="w-full shadow-lg rounded-xl transition hover:scale-[1.01]" />
          </q-form>
        </q-card-section>
      </q-card>

      <!-- Registered Branches -->
      <q-card class="shadow-2xl rounded-2xl overflow-hidden border border-white/40 bg-white/80 backdrop-blur-xl">
        <q-card-section class="bg-gray-800 text-white flex flex-col sm:flex-row justify-between items-center gap-2 q-pa-sm">
          <div class="font-bold text-lg"><q-icon name="list" /> Registered Branches</div>
          <q-btn v-if="selectedBranches.length > 0" color="negative" icon="delete" label="Delete Selected" @click="deleteSelected" size="sm" />
        </q-card-section>

        <q-table
          :rows="branches"
          :columns="columns"
          row-key="code"
          selection="multiple"
          v-model:selected="selectedBranches"
          flat
          :grid="$q.screen.lt.md"
          :filter="searchQuery"
          class="bg-transparent"
          table-header-class="bg-gray-100 text-gray-700 font-bold"
        >
          <template v-slot:top-right>
            <q-input borderless dense debounce="300" v-model="searchQuery" placeholder="Search Branches..." class="bg-white px-3 rounded-full border border-gray-300">
              <template v-slot:append><q-icon name="search" /></template>
            </q-input>
          </template>

          <template v-slot:top-left>
            <q-btn 
              v-if="selectedBranches.length > 0" 
              color="negative" 
              icon="delete" 
              :label="`Delete Selected (${selectedBranches.length})`" 
              @click="deleteSelected"
              class="shadow-md rounded-lg"
            />
          </template>
          
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat round color="primary" icon="edit" @click="openEditDialog(props.row)" size="sm" class="hover:bg-blue-50 transition" />
              <q-btn flat round color="negative" icon="delete" @click="removeBranch(props.row.code)" size="sm" class="hover:bg-red-50 transition" />
            </q-td>
          </template>
        </q-table>
      </q-card>

      <!-- Generate Report -->
      <q-card class="shadow-2xl rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl">
        <q-card-section class="bg-gradient-to-r from-gray-800 to-black text-white rounded-t-2xl q-pa-md">
          <div class="text-h6 font-bold flex items-center gap-2">
            <q-icon name="assessment" size="sm" />
            Branch Data Analytics
          </div>
        </q-card-section>
        
        <q-card-section class="q-pa-md space-y-4">
          <div class="flex flex-col md:flex-row gap-4">
            <q-select v-model="selectedReportBranch" :options="branchOptions" option-label="label" option-value="value" label="Select Branch" outlined dense class="flex-grow bg-white/50" emit-value map-options />
            <q-input v-model="reportDate" label="Custom Date" type="date" outlined dense class="bg-white/50 w-full md:w-64" />
            <q-btn color="black" label="Generate Report" @click="generateReport" class="shadow-md rounded-xl px-6" />
          </div>

          <div v-if="reportGenerated" class="mt-4 p-4 bg-white/60 rounded-xl border border-gray-200">
            <h3 class="text-lg font-bold text-red-800 mb-2">Report for {{ selectedReportBranch }} on {{ reportDate }}</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div class="font-bold text-blue-800">Pending Shipments (Picked)</div>
                <div class="text-2xl font-bold">{{ pendingShipments }} Orders</div>
              </div>
              <div class="p-3 bg-green-50 border border-green-100 rounded-lg">
                <div class="font-bold text-green-800">Dispatched Items (Packed)</div>
                <div class="text-2xl font-bold">{{ dispatchedItemsTotal }} Items</div>
              </div>
            </div>

            <div class="mt-4">
              <h4 class="font-bold text-gray-700 mb-2">Item Breakdown</h4>
              <q-list bordered separator class="bg-white rounded-lg">
                <q-item v-for="(qty, item) in itemBreakdown" :key="item">
                  <q-item-section><span class="font-semibold">{{ item }}</span></q-item-section>
                  <q-item-section side><q-badge color="red">{{ qty }} EA</q-badge></q-item-section>
                </q-item>
                <q-item v-if="Object.keys(itemBreakdown).length === 0">
                  <q-item-section class="text-gray-500 italic">No items found for this date.</q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Edit Dialog -->
      <q-dialog v-model="showEditDialog">
        <q-card class="w-full max-w-sm rounded-2xl">
          <q-card-section class="bg-gray-800 text-white rounded-t-2xl flex justify-between items-center">
            <div class="text-h6 font-bold flex items-center gap-2">
              <q-icon name="edit" />
              Edit Branch
            </div>
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>
          
          <q-card-section class="q-pt-md">
            <q-form @submit.prevent="saveEdit" class="flex flex-col gap-3">
              <q-input v-model="editBranchData.code" label="Branch Code" outlined dense disable class="bg-gray-100" />
              <q-input v-model="editBranchData.name" label="Branch Name" outlined dense required autofocus />
              <q-btn type="submit" color="primary" label="Save Changes" class="w-full shadow-lg rounded-xl mt-4" />
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from '../supabase'

const $q = useQuasar()
const branches = ref([])
const newBranch = ref({ code: '', name: '' })

// Table State
const searchQuery = ref('')
const selectedBranches = ref([])
const showEditDialog = ref(false)
const editBranchData = ref({})
const columns = [
  { name: 'code', align: 'left', label: 'Branch Code', field: 'code', sortable: true },
  { name: 'name', align: 'left', label: 'Branch Name', field: 'name', sortable: true },
  { name: 'actions', align: 'center', label: 'Actions', field: 'actions' }
]

// Report State
const selectedReportBranch = ref('')
const reportDate = ref(new Date().toISOString().split('T')[0])
const reportGenerated = ref(false)
const pendingShipments = ref(0)
const dispatchedItemsTotal = ref(0)
const itemBreakdown = ref({})

onMounted(() => {
  fetchBranches()
})

const fetchBranches = async () => {
  const { data, error } = await supabase.from('branches').select('*').order('code')
  if (!error && data) {
    branches.value = data
  }
}

const branchOptions = computed(() => {
  return branches.value.map(b => ({ label: `${b.code} - ${b.name}`, value: b.code }))
})

const addBranch = async () => {
  if (newBranch.value.code && newBranch.value.name) {
    if (branches.value.find(b => b.code === newBranch.value.code)) {
      $q.notify({ color: 'warning', message: 'Branch Code already exists!' })
      return
    }
    
    const { error } = await supabase.from('branches').insert([{ code: newBranch.value.code, name: newBranch.value.name }])
    
    if (error) {
      $q.notify({ color: 'negative', message: 'Failed to add branch' })
      return
    }
    
    $q.notify({ color: 'positive', message: 'Branch Registered Successfully' })
    newBranch.value = { code: '', name: '' }
    fetchBranches()
  }
}

const removeBranch = async (code) => {
  const { error } = await supabase.from('branches').delete().eq('code', code)
  if (!error) {
    $q.notify({ color: 'info', message: 'Branch Deleted' })
    fetchBranches()
  }
}

const deleteSelected = async () => {
  const codesToDelete = selectedBranches.value.map(b => b.code)
  if (codesToDelete.length > 0) {
    await supabase.from('branches').delete().in('code', codesToDelete)
    selectedBranches.value = []
    $q.notify({ color: 'positive', message: 'Selected Branches Deleted' })
    fetchBranches()
  }
}

const openEditDialog = (branch) => {
  editBranchData.value = { ...branch }
  showEditDialog.value = true
}

const saveEdit = async () => {
  const { error } = await supabase.from('branches').update({ name: editBranchData.value.name }).eq('code', editBranchData.value.code)
  if (!error) {
    showEditDialog.value = false
    $q.notify({ color: 'positive', message: 'Branch Updated' })
    fetchBranches()
  } else {
    $q.notify({ color: 'negative', message: 'Failed to update branch' })
  }
}

const generateReport = async () => {
  if (!selectedReportBranch.value) {
    $q.notify({ color: 'warning', message: 'Please select a branch' })
    return
  }

  const { data: allOrders } = await supabase.from('orders').select('*')
  const orders = allOrders || []

  const filteredOrders = orders.filter(o => o.branchCode === selectedReportBranch.value && o.date === reportDate.value)
  pendingShipments.value = filteredOrders.filter(o => o.status !== 'Packed' && o.status !== 'Collected').length
  
  const packedOrders = filteredOrders.filter(o => o.status === 'Packed' || o.status === 'Collected')
  let dispatched = 0
  const breakdown = {}

  packedOrders.forEach(order => {
    order.items.forEach(item => {
      dispatched += item.qtyInEA
      if (!breakdown[item.name]) breakdown[item.name] = 0
      breakdown[item.name] += item.qtyInEA
    })
  })

  dispatchedItemsTotal.value = dispatched
  itemBreakdown.value = breakdown
  reportGenerated.value = true
}
</script>
