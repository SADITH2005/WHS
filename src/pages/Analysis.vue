<template>
  <q-page class="q-pa-md bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
    <div class="max-w-5xl mx-auto space-y-6">
      
      <div class="text-h4 font-black text-black text-center q-mb-lg drop-shadow-sm">System Analytics</div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Highest Demand Item -->
        <q-card class="shadow-2xl rounded-2xl border-2 border-black bg-white text-black transform transition hover:scale-105">
          <q-card-section class="flex flex-col items-center text-center q-pa-lg">
            <q-icon name="trending_up" size="60px" class="q-mb-md text-black" />
            <div class="text-h6 font-black uppercase tracking-wider">Highest Demand</div>
            <div class="text-h5 mt-2 font-black">{{ highestDemandItem.name || 'N/A' }}</div>
            <div class="text-subtitle1 font-bold bg-gray-200 border border-black px-3 py-1 rounded-full mt-3">{{ highestDemandItem.qty || 0 }} EA Picked</div>
          </q-card-section>
        </q-card>

        <!-- Lowest Demand Item -->
        <q-card class="shadow-2xl rounded-2xl border-2 border-black bg-white text-black transform transition hover:scale-105">
          <q-card-section class="flex flex-col items-center text-center q-pa-lg">
            <q-icon name="trending_down" size="60px" class="q-mb-md text-black" />
            <div class="text-h6 font-black uppercase tracking-wider">Lowest Demand</div>
            <div class="text-h5 mt-2 font-black">{{ lowestDemandItem.name || 'N/A' }}</div>
            <div class="text-subtitle1 font-bold bg-gray-200 border border-black px-3 py-1 rounded-full mt-3">{{ lowestDemandItem.qty || 0 }} EA Picked</div>
          </q-card-section>
        </q-card>

        <!-- Top Branch -->
        <q-card class="shadow-2xl rounded-2xl border-2 border-black bg-white text-black transform transition hover:scale-105">
          <q-card-section class="flex flex-col items-center text-center q-pa-lg">
            <q-icon name="store" size="60px" class="q-mb-md text-black" />
            <div class="text-h6 font-black uppercase tracking-wider">Top Branch</div>
            <div class="text-h5 mt-2 font-black">{{ topBranch.code || 'N/A' }}</div>
            <div class="text-subtitle1 font-bold bg-gray-200 border border-black px-3 py-1 rounded-full mt-3">{{ topBranch.qty || 0 }} Items Dispatched</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Detailed Branch Item Report -->
      <q-card class="shadow-2xl rounded-2xl overflow-hidden border-2 border-black bg-white mt-8">
        <q-card-section class="bg-black text-white q-pa-md flex justify-between items-center">
          <div class="text-h6 font-bold flex items-center gap-2">
            <q-icon name="assessment" />
            Branch Distribution Report (All Created Invoices)
          </div>
        </q-card-section>
        
        <q-table
          :rows="branchReportData"
          :columns="reportColumns"
          row-key="branchCode"
          flat
          class="bg-transparent text-black font-bold"
          table-header-class="bg-gray-200 text-black font-black"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-totalItems="props">
            <q-td :props="props">
              <q-badge color="black" class="font-bold px-2 py-1">{{ props.row.totalItems }} EA</q-badge>
            </q-td>
          </template>
        </q-table>
      </q-card>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const highestDemandItem = ref({})
const lowestDemandItem = ref({})
const topBranch = ref({})
const branchReportData = ref([])

const reportColumns = [
  { name: 'branchCode', align: 'left', label: 'Branch Code & Name', field: 'branchCode', sortable: true },
  { name: 'totalOrders', align: 'center', label: 'Total Invoices', field: 'totalOrders', sortable: true },
  { name: 'totalItems', align: 'center', label: 'Total Items (EA)', field: 'totalItems', sortable: true }
]

onMounted(async () => {
  const { data: orders, error } = await supabase.from('orders').select('*')
  if (error || !orders) return
  
  const itemCounts = {}
  const branchCounts = {}

  orders.forEach(order => {
    // Branch counts structure
    const fullBranchName = `${order.branchCode} - ${order.branchName}`
    if (!branchCounts[fullBranchName]) branchCounts[fullBranchName] = { qty: 0, orders: 0 }
    branchCounts[fullBranchName].orders += 1
    
    order.items.forEach(item => {
      // Branch total items
      branchCounts[fullBranchName].qty += item.qtyInEA
      
      // Item total counts
      if (!itemCounts[item.name]) itemCounts[item.name] = 0
      itemCounts[item.name] += item.qtyInEA
    })
  })

  // Calculate highest and lowest items
  let highestItem = { name: '', qty: -1 }
  let lowestItem = { name: '', qty: Infinity }

  for (const [name, qty] of Object.entries(itemCounts)) {
    if (qty > highestItem.qty) {
      highestItem = { name, qty }
    }
    if (qty < lowestItem.qty) {
      lowestItem = { name, qty }
    }
  }

  if (highestItem.qty !== -1) highestDemandItem.value = highestItem
  if (lowestItem.qty !== Infinity) lowestDemandItem.value = lowestItem

  // Calculate top branch & generate report data
  let topB = { code: '', qty: -1 }
  const reportArr = []
  
  for (const [code, data] of Object.entries(branchCounts)) {
    if (data.qty > topB.qty) {
      topB = { code, qty: data.qty }
    }
    reportArr.push({
      branchCode: code,
      totalOrders: data.orders,
      totalItems: data.qty
    })
  }

  if (topB.qty !== -1) topBranch.value = topB
  
  branchReportData.value = reportArr.sort((a, b) => b.totalItems - a.totalItems)
})
</script>
