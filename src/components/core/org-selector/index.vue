<template>
  <!-- 面板模式 -->
  <div v-if="mode === 'panel'" class="org-selector">
    <div class="org-selector-content">
      <!-- 搜索框 -->
      <div class="search-section mb-4">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索部门或人员"
          clearable
          @input="handleSearchChange"
          @keyup.enter="handleSearch"
        />
      </div>

      <div class="selector-body flex gap-4">
        <!-- 左侧：组织架构树 -->
        <div class="org-tree flex-1">
          <!-- 面包屑导航 -->
          <div v-if="breadcrumbs.length > 0" class="breadcrumb mb-3">
            <el-breadcrumb>
              <el-breadcrumb-item
                v-for="(item, index) in breadcrumbs"
                :key="item.id"
                class="cursor-pointer"
                @click="navigateToLevel(index)"
              >
                {{ item.name }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>

          <!-- 搜索结果 -->
          <div v-if="isSearching" class="search-results">
            <div class="search-title mb-2 text-sm text-gray-500">
              搜索结果 ({{ searchResults.length }})
            </div>
            <div class="search-list max-h-96 overflow-auto">
              <div
                v-for="item in searchResults"
                :key="getItemId(item)"
                class="search-item flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                @click="handleSearchItemClick(item)"
              >
                <el-checkbox
                  v-model="item.isChecked"
                  :disabled="shouldDisableCheckbox(item)"
                  @click.stop
                  @change="(checked: boolean) => handleCheckChange(checked, item)"
                />
                <div class="ml-2 flex-1">
                  <div class="item-name text-gray-900">{{ getItemName(item) }}</div>
                  <div class="item-path text-xs text-gray-500">
                    {{ getItemPath(item) }}
                  </div>
                </div>
                <div class="item-type text-xs text-blue-500">
                  {{ item.type === 'department' ? '部门' : '人员' }}
                </div>
              </div>
            </div>
          </div>

          <!-- 正常树状结构 -->
          <div v-else class="org-tree-structure">
            <!-- 部门列表 -->
            <div v-if="currentLevel.children?.length > 0" class="departments mb-4">
              <div class="section-title text-sm font-medium text-gray-700 mb-2 pb-1 border-b border-gray-200">
                部门
              </div>
              <div
                v-for="dept in currentLevel.children"
                :key="dept.id"
                class="dept-item flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
              >
                <el-checkbox
                  v-model="dept.isChecked"
                  :disabled="shouldDisableCheckbox(dept)"
                  @change="(checked: boolean) => handleCheckChange(checked, dept)"
                  @click.stop
                />
                <div class="ml-2 flex-1" @click="enterDepartment(dept)">
                  <div class="flex items-center">
                    <FolderIcon class="w-4 h-4 text-blue-500 mr-2" />
                    <span class="text-gray-900">{{ dept.name }}</span>
                    <span class="ml-auto text-xs text-gray-400">
                      {{ dept.staffs?.length || 0 }}人
                    </span>
                  </div>
                </div>
                <ChevronRightIcon
                  class="w-4 h-4 text-gray-400"
                  @click="enterDepartment(dept)"
                />
              </div>
            </div>

            <!-- 人员列表 -->
            <div v-if="currentLevel.staffs && currentLevel.staffs.length > 0" class="staff-list">
              <div class="section-title text-sm font-medium text-gray-700 mb-2 pb-1 border-b border-gray-200">
                人员 ({{ currentLevel.staffs.length }})
              </div>
              <div
                v-for="staff in currentLevel.staffs"
                :key="staff.idStaff"
                class="staff-item flex items-center p-2 hover:bg-gray-50 rounded transition-colors"
              >
                <el-checkbox
                  v-model="staff.isChecked"
                  :disabled="shouldDisableCheckbox(staff)"
                  @change="(checked: boolean) => handleCheckChange(checked, staff)"
                />
                <div class="ml-2 flex-1">
                  <div class="flex items-center">
                    <UserIcon class="w-4 h-4 text-green-500 mr-2" />
                    <span class="text-gray-900">{{ staff.staffName }}</span>
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ staff.position || '暂无职位' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：已选列表 -->
        <div class="selected-panel w-80 border-l border-gray-200 pl-4">
          <div class="panel-header flex items-center justify-between mb-3">
            <span class="font-medium text-gray-900">已选 ({{ selectedItems.length }})</span>
            <el-button
              v-if="selectedItems.length > 0"
              type="primary"
              link
              size="small"
              @click="clearAll"
            >
              清空
            </el-button>
          </div>

          <div class="selected-list max-h-96 overflow-auto">
            <div
              v-for="item in selectedItems"
              :key="getItemId(item)"
              class="selected-item flex items-center p-2 bg-blue-50 rounded mb-2 transition-colors"
            >
              <div class="flex-1">
                <div class="item-name text-sm text-gray-900">{{ getItemName(item) }}</div>
                <div class="item-type text-xs text-gray-500">
                  {{ item.type === 'department' ? '部门' : '人员' }}
                </div>
              </div>
              <XIcon
                class="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-500 transition-colors"
                @click="removeSelected(item)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 弹窗模式 -->
  <el-dialog
    v-else
    :model-value="visible"
    :title="title"
    width="900px"
    align-center
    class="el-dialog-border"
    @update:model-value="(val: boolean) => emit('update:visible', val)"
    @close="handleCancel"
  >
    <div class="org-selector-modal-content">
      <!-- 搜索框 -->
      <div class="search-section mb-4">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索部门或人员"
          clearable
          @input="handleSearchChange"
          @keyup.enter="handleSearch"
        />
      </div>

      <div class="selector-body flex gap-4">
        <!-- 左侧：组织架构树 -->
        <div class="org-tree flex-1">
          <!-- 面包屑导航 -->
          <div v-if="breadcrumbs.length > 0" class="breadcrumb mb-3">
            <el-breadcrumb>
              <el-breadcrumb-item
                v-for="(item, index) in breadcrumbs"
                :key="item.id"
                class="cursor-pointer"
                @click="navigateToLevel(index)"
              >
                {{ item.name }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>

          <!-- 搜索结果 -->
          <div v-if="isSearching" class="search-results">
            <div class="search-title mb-2 text-sm text-gray-500">
              搜索结果 ({{ searchResults.length }})
            </div>
            <div class="search-list max-h-80 overflow-auto">
              <div
                v-for="item in searchResults"
                :key="getItemId(item)"
                class="search-item flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                @click="handleSearchItemClick(item)"
              >
                <el-checkbox
                  v-model="item.isChecked"
                  :disabled="shouldDisableCheckbox(item)"
                  @click.stop
                  @change="(checked: boolean) => handleCheckChange(checked, item)"
                />
                <div class="ml-2 flex-1">
                  <div class="item-name text-gray-900">{{ getItemName(item) }}</div>
                  <div class="item-path text-xs text-gray-500">
                    {{ getItemPath(item) }}
                  </div>
                </div>
                <div class="item-type text-xs text-blue-500">
                  {{ item.type === 'department' ? '部门' : '人员' }}
                </div>
              </div>
            </div>
          </div>

          <!-- 正常树状结构 -->
          <div v-else class="org-tree-structure">
            <!-- 部门列表 -->
            <div v-if="currentLevel.children?.length > 0" class="departments mb-4">
              <div class="section-title text-sm font-medium text-gray-700 mb-2 pb-1 border-b border-gray-200">
                部门
              </div>
              <div
                v-for="dept in currentLevel.children"
                :key="dept.id"
                class="dept-item flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
              >
                <el-checkbox
                  v-model="dept.isChecked"
                  :disabled="shouldDisableCheckbox(dept)"
                  @change="(checked: boolean) => handleCheckChange(checked, dept)"
                  @click.stop
                />
                <div class="ml-2 flex-1" @click="enterDepartment(dept)">
                  <div class="flex items-center">
                    <FolderIcon class="w-4 h-4 text-blue-500 mr-2" />
                    <span class="text-gray-900">{{ dept.name }}</span>
                    <span class="ml-auto text-xs text-gray-400">
                      {{ dept.staffs?.length || 0 }}人
                    </span>
                  </div>
                </div>
                <ChevronRightIcon
                  class="w-4 h-4 text-gray-400"
                  @click="enterDepartment(dept)"
                />
              </div>
            </div>

            <!-- 人员列表 -->
            <div v-if="currentLevel.staffs && currentLevel.staffs.length > 0" class="staff-list">
              <div class="section-title text-sm font-medium text-gray-700 mb-2 pb-1 border-b border-gray-200">
                人员 ({{ currentLevel.staffs.length }})
              </div>
              <div
                v-for="staff in currentLevel.staffs"
                :key="staff.idStaff"
                class="staff-item flex items-center p-2 hover:bg-gray-50 rounded transition-colors"
              >
                <el-checkbox
                  v-model="staff.isChecked"
                  :disabled="shouldDisableCheckbox(staff)"
                  @change="(checked: boolean) => handleCheckChange(checked, staff)"
                />
                <div class="ml-2 flex-1">
                  <div class="flex items-center">
                    <UserIcon class="w-4 h-4 text-green-500 mr-2" />
                    <span class="text-gray-900">{{ staff.staffName }}</span>
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ staff.position || '暂无职位' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：已选列表 -->
        <div class="selected-panel w-80 border-l border-gray-200 pl-4">
          <div class="panel-header flex items-center justify-between mb-3">
            <span class="font-medium text-gray-900">已选 ({{ selectedItems.length }})</span>
            <el-button
              v-if="selectedItems.length > 0"
              type="primary"
              link
              size="small"
              @click="clearAll"
            >
              清空
            </el-button>
          </div>

          <div class="selected-list max-h-80 overflow-auto">
            <div
              v-for="item in selectedItems"
              :key="getItemId(item)"
              class="selected-item flex items-center p-2 bg-blue-50 rounded mb-2 transition-colors"
            >
              <div class="flex-1">
                <div class="item-name text-sm text-gray-900">{{ getItemName(item) }}</div>
                <div class="item-type text-xs text-gray-500">
                  {{ item.type === 'department' ? '部门' : '人员' }}
                </div>
              </div>
              <XIcon
                class="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-500 transition-colors"
                @click="removeSelected(item)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer flex justify-between items-center">
        <span class="text-sm text-gray-500">
          已选择 {{ selectedItems.length }} 项
        </span>
        <div class="flex gap-2">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { FolderIcon, UserIcon, ChevronRightIcon, XIcon } from 'lucide-vue-next';

// 类型定义
interface Staff {
  idStaff: string;
  staffName: string;
  position?: string;
  isChecked: boolean;
  type: 'staff';
  parent?: string;
}

interface Department {
  id: string;
  name: string;
  children?: Department[];
  staffs?: Staff[];
  isChecked: boolean;
  type: 'department';
  parent?: string;
  level: number;
}

interface OrgData {
  children: Department[];
  staffs?: Staff[];
}

// Props
interface Props {
  data?: OrgData;
  multiple?: boolean;
  onlySelectPerson?: boolean;
  mode?: 'panel' | 'modal';
  visible?: boolean;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  multiple: true,
  onlySelectPerson: false,
  mode: 'panel',
  visible: false,
  title: '选择人员',
});

// Emits
const emit = defineEmits<{
  change: [selectedItems: (Staff | Department)[]];
  'update:visible': [visible: boolean];
  confirm: [selectedItems: (Staff | Department)[]];
  cancel: [];
}>();

// 响应式数据
const orgData = ref<OrgData>({ children: [] });
const allStaffList = ref<Staff[]>([]);
const currentLevel = ref<OrgData>({ children: [] });
const breadcrumbs = ref<Department[]>([]);
const selectedItems = ref<(Staff | Department)[]>([]);

// 搜索相关
const searchKeyword = ref('');
const searchResults = ref<(Staff | Department)[]>([]);
const isSearching = computed(() => searchKeyword.value.trim().length > 0);

// 工具函数
const getItemId = (item: Staff | Department): string => {
  return 'id' in item ? item.id : item.idStaff;
};

const getItemName = (item: Staff | Department): string => {
  return 'name' in item ? item.name : item.staffName;
};

// 初始化数据
const initializeData = (data: OrgData) => {
  // 添加 isChecked 属性和层级信息
  const processData = (items: Department[], level = 0, parentId?: string): Department[] => {
    return items.map(item => {
      const processed: Department = {
        ...item,
        isChecked: false,
        type: 'department',
        level,
        parent: parentId,
      };

      if (processed.staffs) {
        processed.staffs = processed.staffs.map(staff => ({
          ...staff,
          isChecked: false,
          type: 'staff',
          parent: processed.id,
        }));
      }

      if (processed.children) {
        processed.children = processData(processed.children, level + 1, processed.id);
      }

      return processed;
    });
  };

  orgData.value = {
    children: processData(data.children || []),
    staffs: data.staffs?.map(staff => ({
      ...staff,
      isChecked: false,
      type: 'staff',
    })),
  };

  currentLevel.value = orgData.value;

  // 收集所有人员用于搜索
  collectAllStaff();
};

// 收集所有人员
const collectAllStaff = () => {
  const allStaff: Staff[] = [];

  const collectFromDept = (dept: Department) => {
    if (dept.staffs) {
      allStaff.push(...dept.staffs);
    }
    if (dept.children) {
      dept.children.forEach(collectFromDept);
    }
  };

  orgData.value.children.forEach(collectFromDept);
  if (orgData.value.staffs) {
    allStaff.push(...orgData.value.staffs);
  }

  // 去重
  const staffMap = new Map();
  allStaff.forEach(staff => {
    if (!staffMap.has(staff.idStaff)) {
      staffMap.set(staff.idStaff, staff);
    }
  });

  allStaffList.value = Array.from(staffMap.values());
};

// 搜索功能
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = [];
    return;
  }

  const keyword = searchKeyword.value.toLowerCase();
  const results: (Staff | Department)[] = [];

  // 搜索人员
  allStaffList.value.forEach(staff => {
    if (staff.staffName.toLowerCase().includes(keyword)) {
      results.push(staff);
    }
  });

  // 搜索部门
  const searchDepartments = (depts: Department[]) => {
    depts.forEach(dept => {
      if (dept.name.toLowerCase().includes(keyword)) {
        results.push(dept);
      }
      if (dept.children) {
        searchDepartments(dept.children);
      }
    });
  };

  searchDepartments(orgData.value.children);
  searchResults.value = results;
};

const handleSearchChange = () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = [];
  } else {
    handleSearch();
  }
};

// 路径获取
const getItemPath = (item: Staff | Department) => {
  const parents = getParentPath(item);
  return parents.map(p => p.name).join(' / ');
};

const getParentPath = (item: Staff | Department): Department[] => {
  const path: Department[] = [];

  const findParent = (id: string | undefined, depts: Department[]): Department | null => {
    for (const dept of depts) {
      if (dept.id === id) return dept;
      if (dept.children) {
        const found = findParent(id, dept.children);
        if (found) return found;
      }
    }
    return null;
  };

  let currentParentId = item.parent;
  while (currentParentId) {
    const parent = findParent(currentParentId, orgData.value.children);
    if (parent) {
      path.unshift(parent);
      currentParentId = parent.parent;
    } else {
      break;
    }
  }

  return path;
};

// 导航功能
const enterDepartment = (dept: Department) => {
  breadcrumbs.value.push(dept);
  currentLevel.value = dept as any;
};

const navigateToLevel = (index: number) => {
  if (index === -1) {
    // 返回根目录
    breadcrumbs.value = [];
    currentLevel.value = orgData.value;
  } else {
    breadcrumbs.value = breadcrumbs.value.slice(0, index + 1);
    currentLevel.value = breadcrumbs.value[index] as any;
  }
};

// 选择逻辑
const shouldDisableCheckbox = (item: Staff | Department) => {
  if (props.onlySelectPerson && item.type === 'department') {
    return true;
  }
  if (!props.multiple && selectedItems.value.length > 0 && !item.isChecked) {
    return true;
  }
  return false;
};

const handleCheckChange = (checked: boolean, item: Staff | Department) => {
  // v-model 已经更新了 item.isChecked，这里只需处理 selectedItems 的维护
  if (checked) {
    if (!props.multiple) {
      // 单选模式：清除其他选择
      selectedItems.value.forEach(selected => {
        if (getItemId(selected) !== getItemId(item)) {
          selected.isChecked = false;
        }
      });
      selectedItems.value = [item];
    } else {
      selectedItems.value.push(item);
    }
  } else {
    const index = selectedItems.value.findIndex(
      selected => getItemId(selected) === getItemId(item)
    );
    if (index > -1) {
      selectedItems.value.splice(index, 1);
    }
  }

  emit('change', selectedItems.value);
};

const handleSearchItemClick = (item: Staff | Department) => {
  if (item.type === 'department') {
    // 导航到该部门
    const path = getParentPath(item);
    breadcrumbs.value = [...path, item as Department];
    currentLevel.value = item as any;
    searchKeyword.value = '';
    searchResults.value = [];
  }
};

const removeSelected = (item: Staff | Department) => {
  item.isChecked = false;
  const index = selectedItems.value.findIndex(
    selected => getItemId(selected) === getItemId(item)
  );
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  }
  emit('change', selectedItems.value);
};

const clearAll = () => {
  selectedItems.value.forEach(item => {
    item.isChecked = false;
  });
  selectedItems.value = [];
  emit('change', selectedItems.value);
};

// Modal handlers
const handleCancel = () => {
  emit('update:visible', false);
  emit('cancel');
};

const handleConfirm = () => {
  emit('confirm', selectedItems.value);
  emit('update:visible', false);
};

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData) {
    initializeData(newData);
  }
}, { immediate: true });

onMounted(() => {
  if (props.data) {
    initializeData(props.data);
  }
});

defineOptions({
  name: 'OrgSelector',
});
</script>

<style lang="scss" scoped>
.org-selector {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 16px;
  height: 600px;
}

.org-selector-content {
  height: calc(100% - 60px);
}

.org-tree {
  overflow: auto;
}

.search-results {
  max-height: 384px;
  overflow: auto;
}

.search-item,
.dept-item,
.staff-item {
  transition: background-color 0.2s;

  &:hover {
    background-color: #eff6ff;
  }
}

.selected-panel {
  overflow: auto;
}

.selected-list {
  max-height: 384px;
  overflow: auto;
}

.breadcrumb {
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;

  :deep(.el-breadcrumb__item) {
    cursor: pointer;
  }
}

.section-title {
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 4px;
}

:deep(.el-checkbox) {
  height: auto;
  margin-right: 0;
}
</style>
