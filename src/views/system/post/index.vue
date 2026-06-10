<!-- 岗位管理 -->
<template>
  <div class="post-page art-full-height">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-3 gap-3 mb-3 max-[1180px]:grid-cols-2 max-sm:grid-cols-1">
      <div class="post-stat-card flex items-center gap-3 rounded-lg border border-solid p-3.5 cursor-pointer" style="border-color: var(--art-card-border); background: var(--default-box-color)">
        <div class="post-stat-icon flex-cc h-9.5 w-9.5 shrink-0 rounded-lg" style="color: var(--theme-color); background: color-mix(in srgb, var(--theme-color) 12%, transparent)">
          <ArtSvgIcon icon="ri:briefcase-line" />
        </div>
        <div>
          <div class="text-11px mb-0.5 truncate" style="color: var(--art-gray-600)">岗位总数</div>
          <div class="text-xl font-bold leading-6" style="color: var(--art-gray-900)">{{ total }}</div>
        </div>
      </div>
      <div class="post-stat-card flex items-center gap-3 rounded-lg border border-solid p-3.5 cursor-pointer" style="border-color: var(--art-card-border); background: var(--default-box-color)">
        <div class="post-stat-icon flex-cc h-9.5 w-9.5 shrink-0 rounded-lg" style="color: var(--art-success); background: color-mix(in srgb, var(--art-success) 12%, transparent)">
          <ArtSvgIcon icon="ri:checkbox-circle-line" />
        </div>
        <div>
          <div class="text-11px mb-0.5 truncate" style="color: var(--art-gray-600)">已启用</div>
          <div class="text-xl font-bold leading-6" style="color: var(--art-gray-900)">{{ postStats.enabled }}</div>
        </div>
      </div>
      <div class="post-stat-card flex items-center gap-3 rounded-lg border border-solid p-3.5 cursor-pointer" style="border-color: var(--art-card-border); background: var(--default-box-color)">
        <div class="post-stat-icon flex-cc h-9.5 w-9.5 shrink-0 rounded-lg" style="color: var(--art-danger); background: color-mix(in srgb, var(--art-danger) 12%, transparent)">
          <ArtSvgIcon icon="ri:close-circle-line" />
        </div>
        <div>
          <div class="text-11px mb-0.5 truncate" style="color: var(--art-gray-600)">已停用</div>
          <div class="text-xl font-bold leading-6" style="color: var(--art-gray-900)">{{ postStats.disabled }}</div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="post-toolbar flex items-center gap-2.5 flex-wrap p-3.5 mb-3 rounded-lg border border-solid" style="border-color: var(--art-card-border); background: var(--default-box-color)">
      <div class="post-search-box relative flex-1 basis-60">
        <ArtSvgIcon icon="ri:search-line" :size="14" class="post-search-icon absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--art-gray-600)" />
        <input
          v-model="toolbarSearch.name"
          class="post-search-input w-full rounded-md border border-solid bg-box py-1.5 pl-8 pr-3 text-12px outline-none tad-200"
          style="border-color: var(--default-border); color: inherit"
          placeholder="搜索岗位名称..."
          @keyup.enter="handleToolbarSearch"
        />
      </div>
      <select v-model="toolbarSearch.status" class="post-filter-select" @change="handleToolbarSearch">
        <option value="">全部状态</option>
        <option value="1">启用</option>
        <option value="0">停用</option>
      </select>
      <div class="flex-1"></div>
      <button class="post-btn flex-c gap-1.5 rounded-md border border-solid bg-transparent px-3.5 py-1.5 text-12px c-p tad-200" style="border-color: var(--default-border); color: var(--art-gray-700)" @click="handleToolbarReset">
        <ArtSvgIcon icon="ri:refresh-line" :size="13" />
        重置
      </button>
      <button class="post-btn post-btn--primary flex-c gap-1.5 rounded-md border px-3.5 py-1.5 text-12px font-medium c-p tad-200" style="color: #fff; background: var(--theme-color); border-color: var(--theme-color)" @click="showDialog('add')">
        <ArtSvgIcon icon="ri:add-line" :size="12" />
        新增岗位
      </button>
    </div>

    <!-- 表格卡片 -->
    <div class="post-table-card art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="handleRefresh" />

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </div>

    <!-- 岗位弹窗 -->
    <PostDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :post-data="currentPostData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElTag, ElMessageBox } from 'element-plus'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import {
    usePostListQuery,
    useRemovePostMutation,
    useChangePostStatusMutation
  } from '@/hooks/queries/usePostQuery'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import PostDialog from './modules/post-dialog.vue'

  defineOptions({ name: 'PostManage' })

  type IPost = Api.Post.IPost

  const searchForm = ref<Api.Post.PostSearchParams & { current: number; size: number }>({
    current: 1,
    size: 20,
    name: undefined,
    code: undefined,
    status: undefined
  })

  const appliedSearch = ref<Api.Post.PostSearchParams>({ current: 1, size: 20 })

  const toolbarSearch = reactive({
    name: '',
    status: '' as string
  })

  const queryParams = computed(() => ({
    ...appliedSearch.value,
    current: searchForm.value.current,
    size: searchForm.value.size
  }))

  const listQuery = usePostListQuery(queryParams)
  const loading = computed(() => listQuery.isLoading.value)
  const data = computed(() => listQuery.data.value?.records ?? [])

  const total = computed(() => listQuery.data.value?.pager?.total ?? 0)

  const postStats = computed(() => {
    const enabled = data.value.filter((item) => item.status === 1 || item.status === '1').length
    return { enabled, disabled: data.value.length - enabled }
  })

  const pagination = reactive({
    current: computed(() => searchForm.value.current),
    size: computed(() => searchForm.value.size),
    total
  })

  const removePost = useRemovePostMutation()
  const changeStatus = useChangePostStatusMutation()

  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const currentPostData = ref<IPost | undefined>()

  const { columns, columnChecks } = useTableColumns<IPost>(() => [
    { type: 'index', width: 60, label: '#' },
    {
      prop: 'name',
      label: '岗位名称',
      minWidth: 140,
      formatter: (row: IPost) =>
        h('span', { class: 'post-entity-title', title: row.description }, row.name || '-')
    },
    {
      prop: 'code',
      label: '岗位编码',
      minWidth: 140,
      formatter: (row: IPost) => h('span', { class: 'post-code-pill' }, row.code || '-')
    },
    { prop: 'sortOrder', label: '排序', width: 80 },
    {
      prop: 'status',
      label: '状态',
      width: 80,
      formatter: (row: IPost) =>
        h(
          ElTag,
          {
            type: row.status === 1 || row.status === '1' ? 'success' : 'danger',
            class: 'post-status-tag'
          },
          () => (row.status === 1 || row.status === '1' ? '启用' : '停用')
        )
    },
    {
      prop: 'createTime',
      label: '创建时间',
      minWidth: 160,
      formatter: (row: IPost) =>
        h('span', { class: 'post-muted-text' }, row.createTime || '-')
    },
    {
      prop: 'operation',
      label: '操作',
      width: 160,
      fixed: 'right',
      formatter: (row: IPost) =>
        h('div', { class: 'post-row-actions' }, [
          h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) }),
          h(ArtButtonTable, {
            type: 'view',
            title: row.status === 1 || row.status === '1' ? '禁用' : '启用',
            onClick: () => toggleStatus(row)
          }),
          h(ArtButtonTable, { type: 'delete', onClick: () => deletePost(row) })
        ])
    }
  ])

  function handleToolbarSearch() {
    appliedSearch.value = {
      current: 1,
      size: 20,
      name: toolbarSearch.name || undefined,
      status: toolbarSearch.status ? (toolbarSearch.status === '1' ? 1 : 0) : undefined
    }
    searchForm.value.current = 1
  }

  function handleToolbarReset() {
    toolbarSearch.name = ''
    toolbarSearch.status = ''
    appliedSearch.value = { current: 1, size: 20 }
    searchForm.value.current = 1
  }

  function handleRefresh() {
    listQuery.refetch()
  }

  function handleSizeChange(size: number) {
    searchForm.value.size = size
    searchForm.value.current = 1
  }

  function handleCurrentChange(current: number) {
    searchForm.value.current = current
  }

  function showDialog(type: 'add' | 'edit', row?: IPost) {
    dialogType.value = type
    currentPostData.value = row
    dialogVisible.value = true
  }

  function handleDialogSuccess() {
    dialogVisible.value = false
    listQuery.refetch()
  }

  function toggleStatus(row: IPost) {
    const newStatus = row.status === 1 || row.status === '1' ? 0 : 1
    changeStatus.mutate(
      { id: row.id!, status: newStatus },
      {
        onSuccess: () => {
          ElMessage.success('状态修改成功')
          listQuery.refetch()
        }
      }
    )
  }

  async function deletePost(row: IPost) {
    await ElMessageBox.confirm(`确定删除岗位"${row.name}"吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    removePost.mutate(row.id!, {
      onSuccess: () => {
        ElMessage.success('删除成功')
        listQuery.refetch()
      }
    })
  }
</script>

<style lang="scss" scoped>
  // ============ 页面容器 ============
  .post-page {
    
    color: var(--art-gray-900);
    
    border-radius: calc(var(--custom-radius) / 2 + 4px);
  }

  // ============ 状态下拉 ============
  .post-filter-select {
    appearance: none;
    cursor: pointer;
    width: auto;
    padding: 7px 28px 7px 10px;
    font-size: 12.5px;
    font-family: inherit;
    color: inherit;
    border-radius: 6px;
    border: 1px solid var(--default-border);
    background-color: var(--default-box-color);
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235e6178' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 9px center;
    outline: none;
    transition: border-color 0.18s;
  }

  // ============ 搜索框/下拉 focus 环 ============
  .post-search-input:focus,
  .post-filter-select:focus {
    border-color: var(--theme-color) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-color) 12%, transparent);
  }

  // ============ 按钮 hover ============
  .post-btn:hover {
    color: var(--art-gray-900) !important;
    background: var(--art-hover-color);
    border-color: var(--art-gray-600);
  }

  .post-btn--primary:hover {
    color: #fff !important;
    background: color-mix(in srgb, var(--theme-color) 85%, #000) !important;
    border-color: color-mix(in srgb, var(--theme-color) 85%, #000) !important;
  }

  // ============ 表格内联样式（无法用 tailwind 表达的） ============
  .post-entity-title {
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
    line-height: 20px;
    color: var(--art-gray-900);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .post-code-pill {
    display: inline-flex;
    max-width: 100%;
    min-height: 24px;
    align-items: center;
    padding: 0 8px;
    overflow: hidden;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    color: var(--art-gray-700);
    text-overflow: ellipsis;
    white-space: nowrap;
    background: var(--default-bg-color);
    border: 1px solid var(--art-card-border);
    border-radius: 4px;
  }

  .post-muted-text {
    color: var(--art-gray-600);
  }

  .post-status-tag.el-tag {
    border-color: transparent;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
  }

  .post-row-actions {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    width: 100%;
    justify-content: flex-end;
  }

  

  // ============ 响应式 ============
  @media (max-width: 768px) {
    .post-page {
      padding: 12px;
    }
  }
</style>
