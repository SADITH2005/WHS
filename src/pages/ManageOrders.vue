<template>
  <q-page class="q-pa-md bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
    <div class="max-w-6xl mx-auto space-y-6">
      <div class="text-h4 font-black text-black text-center q-mb-lg drop-shadow-sm">Order Management</div>

      <q-card class="shadow-2xl rounded-2xl overflow-hidden border-2 border-black bg-white">
        <q-table
          title="Historical Pick Lists (Orders)"
          :rows="filteredOrders"
          :columns="columns"
          row-key="invoiceId"
          flat
          :grid="$q.screen.lt.md"
          :filter="searchQuery"
          selection="multiple"
          v-model:selected="selectedOrders"
          class="bg-transparent text-black font-bold"
          table-header-class="bg-gray-200 text-black font-black"
        >
          <template v-slot:top-right>
            <div class="flex gap-2">
              <q-select 
                v-model="statusFilter" 
                :options="['All', 'Pending', 'Packed', 'Collected']" 
                dense 
                outlined 
                class="bg-white border-2 border-black font-bold text-black w-32"
                label="Status"
              />
              <q-select 
                v-model="dateFilter" 
                :options="['All Time', 'Today', 'Yesterday', 'Next Day', 'Next Week']" 
                dense 
                outlined 
                class="bg-white border-2 border-black font-bold text-black w-32"
                label="Date"
              />
              <q-input borderless dense debounce="300" v-model="searchQuery" placeholder="Search..." class="bg-white px-3 rounded border-2 border-black w-48 font-bold text-black">
                <template v-slot:append><q-icon name="search" color="black" /></template>
              </q-input>
            </div>
          </template>

          <template v-slot:top-left>
            <q-btn 
              v-if="selectedOrders.length > 0" 
              color="negative" 
              icon="delete" 
              :label="`Delete Selected (${selectedOrders.length})`" 
              @click="deleteSelected"
              class="shadow-md rounded-lg"
            />
          </template>

          <!-- Format items count -->
          <template v-slot:body-cell-itemsCount="props">
            <q-td :props="props" class="font-black text-black">
              {{ props.row.items.length }} Items
            </q-td>
          </template>

          <template v-slot:body-cell-branchCode="props">
            <q-td :props="props" class="font-bold text-black">
              {{ props.row.branchCode }} - {{ props.row.branchName }}
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge 
                :color="props.row.status === 'Collected' ? 'black' : (props.row.status.includes('Packed') ? 'positive' : 'warning')" 
                class="px-2 py-1 shadow-sm font-black border border-black"
                :text-color="props.row.status === 'Collected' ? 'white' : 'black'"
              >
                {{ props.row.status }}
              </q-badge>
            </q-td>
          </template>
          
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat round color="black" icon="edit" @click="openEditDialog(props.row)" size="sm" class="hover:bg-gray-200 transition font-bold" />
              <q-btn flat round color="negative" icon="delete" @click="removeOrder(props.row.invoiceId)" size="sm" class="hover:bg-red-200 transition font-bold" />
            </q-td>
          </template>
        </q-table>
      </q-card>

      <!-- Edit Dialog -->
      <q-dialog v-model="showEditDialog" position="right" full-height>
        <q-card class="w-full max-w-md rounded-l-3xl q-pa-sm flex flex-col h-full border-l-4 border-black bg-white text-black">
          <q-card-section class="bg-black text-white rounded-tl-3xl flex justify-between items-center shrink-0">
            <div class="text-h6 font-black flex items-center gap-2">
              <q-icon name="edit_note" />
              Edit Order
            </div>
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>
          
          <q-card-section class="q-pt-md flex-grow overflow-auto space-y-4">
            <q-input v-model="editOrderData.invoiceId" label="Invoice ID" outlined dense disable class="bg-gray-200 font-bold text-black border border-black" />
            
            <q-select 
              v-model="editOrderData.branchCode" 
              :options="branchOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              label="Branch Code" 
              outlined 
              dense 
              class="bg-white font-bold text-black border border-black" 
            />
            
            <q-input v-model="editOrderData.date" type="date" label="Date" outlined dense class="bg-white font-bold text-black border border-black" />
            <q-select v-model="editOrderData.status" :options="['Pending', 'Packed', 'Packed (Partial)', 'Collected']" label="Status" outlined dense class="bg-white font-bold text-black border border-black" />
            
            <div class="font-black text-black mt-4 mb-2">Order Items ({{ editOrderData.items?.length }})</div>
            <q-list separator bordered class="rounded-lg bg-gray-100 border-2 border-black">
              <q-item v-for="(item, idx) in editOrderData.items" :key="idx" class="q-pa-sm border-b border-black">
                <q-item-section>
                  <q-item-label class="font-black text-black">{{ item.name }}</q-item-label>
                  <div class="flex gap-2 mt-1">
                    <q-input v-model.number="item.qtyInEA" type="number" label="Qty (EA)" dense outlined class="bg-white font-bold text-black w-24 border border-black" />
                  </div>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat round color="negative" icon="delete" size="sm" @click="removeItemFromEdit(idx)" />
                </q-item-section>
              </q-item>
              <q-item v-if="editOrderData.items?.length === 0" class="text-gray-500 italic flex justify-center">
                No items left in order.
              </q-item>
            </q-list>
          </q-card-section>

          <q-card-actions class="shrink-0 q-pa-md">
            <q-btn color="black" label="Save Changes" class="w-full shadow-lg rounded-xl h-12 text-lg font-black" @click="saveEdit" />
          </q-card-actions>
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

// Table State
const orders = ref([])
const branchesDb = ref([])
const searchQuery = ref('')
const selectedOrders = ref([])
const showEditDialog = ref(false)
const editOrderData = ref({})
const statusFilter = ref('All')
const dateFilter = ref('All Time')

const columns = [
  { name: 'invoiceId', align: 'left', label: 'Invoice ID', field: 'invoiceId', sortable: true },
  { name: 'branchCode', align: 'left', label: 'Branch Code & Name', field: 'branchCode', sortable: true },
  { name: 'date', align: 'center', label: 'Date', field: 'date', sortable: true },
  { name: 'status', align: 'center', label: 'Status', field: 'status', sortable: true },
  { name: 'itemsCount', align: 'center', label: 'Items', field: 'itemsCount' },
  { name: 'actions', align: 'center', label: 'Actions', field: 'actions' }
]

// Date helper logic
const getFilterDateStr = (offsetDays) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

const filteredOrders = computed(() => {
  let filtered = orders.value

  // Status Filter
  if (statusFilter.value !== 'All') {
    if (statusFilter.value === 'Packed') {
      filtered = filtered.filter(o => o.status.includes('Packed'))
    } else {
      filtered = filtered.filter(o => o.status === statusFilter.value)
    }
  }

  // Date Filter
  if (dateFilter.value !== 'All Time') {
    const todayStr = getFilterDateStr(0)
    const yestStr = getFilterDateStr(-1)
    const nextDayStr = getFilterDateStr(1)
    
    if (dateFilter.value === 'Today') {
      filtered = filtered.filter(o => o.date === todayStr)
    } else if (dateFilter.value === 'Yesterday') {
      filtered = filtered.filter(o => o.date === yestStr)
    } else if (dateFilter.value === 'Next Day') {
      filtered = filtered.filter(o => o.date === nextDayStr)
    } else if (dateFilter.value === 'Next Week') {
      // Very basic "within next 7 days" logic
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + 7)
      const maxDateStr = targetDate.toISOString().split('T')[0]
      filtered = filtered.filter(o => o.date > todayStr && o.date <= maxDateStr)
    }
  }

  return filtered
})

onMounted(() => {
  fetchData()
})

const fetchData = async () => {
  const { data: bData } = await supabase.from('branches').select('*')
  if (bData) branchesDb.value = bData
  
  const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (oData) orders.value = oData
}

const branchOptions = computed(() => {
  return branchesDb.value.map(b => ({ label: `${b.code} - ${b.name}`, value: b.code }))
})

const removeOrder = async (invoiceId) => {
  const { error } = await supabase.from('orders').delete().eq('invoiceId', invoiceId)
  if (!error) {
    $q.notify({ color: 'info', message: 'Order Deleted' })
    fetchData()
  }
}

const deleteSelected = async () => {
  const idsToDelete = selectedOrders.value.map(o => o.invoiceId)
  if (idsToDelete.length > 0) {
    await supabase.from('orders').delete().in('invoiceId', idsToDelete)
    selectedOrders.value = []
    $q.notify({ color: 'positive', message: 'Selected Orders Deleted' })
    fetchData()
  }
}

const openEditDialog = (order) => {
  // Deep clone to avoid mutating the table directly before save
  editOrderData.value = JSON.parse(JSON.stringify(order))
  showEditDialog.value = true
}

const removeItemFromEdit = (index) => {
  editOrderData.value.items.splice(index, 1)
}

const saveEdit = async () => {
  if (editOrderData.value.items.length === 0) {
    $q.notify({ color: 'warning', message: 'Order must have at least one item, or delete the order entirely.' })
    return
  }
  
  const branchName = branchesDb.value.find(b => b.code === editOrderData.value.branchCode)?.name || ''
  
  const { error } = await supabase.from('orders')
    .update({ 
      branchCode: editOrderData.value.branchCode,
      branchName: branchName,
      date: editOrderData.value.date,
      status: editOrderData.value.status,
      items: editOrderData.value.items
    })
    .eq('invoiceId', editOrderData.value.invoiceId)
    
  if (!error) {
    showEditDialog.value = false
    $q.notify({ color: 'positive', message: 'Order Updated Successfully' })
    fetchData()
  } else {
    $q.notify({ color: 'negative', message: 'Failed to update order' })
  }
}
</script>
