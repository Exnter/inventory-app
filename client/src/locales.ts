// file: client/src/locales.ts
export const translations = {
  en: {
    inventory: "Inventory",
    searchPlaceholder: "Search items, tags, notes...",
    printLabels: "Print Labels",
    addItem: "Add Item",
    import: "Import",
    export: "Export CSV",
    location: "Location",
    allLocations: "All Locations",
    tags: "Tags",
    purchaseDate: "Purchase Date",
    status: "Status",
    showArchived: "Show Only Archived",
    clearFilters: "Clear All Filters",
    itemsSelected: "items selected",
    move: "Move",
    archive: "Archive",
    unarchive: "Unarchive",
    delete: "Delete",
    manageWarehouses: "Manage Warehouses",
    manageTags: "Manage Tags",
    language: "Language",
    switchTo: "中文",
    backToInventory: "Back to Inventory",
    correctErrors: "Please correct the highlighted fields.",
    
    // Item List
    qty: "Qty",
    price: "Price",
    lastUpdated: "Last Updated",
    added: "Added",    // NEW
    edited: "Edited",  // NEW
    
    // Dialogs
    editItem: "Edit Item",
    newItem: "Add New Item",
    itemName: "Item Name",
    sku: "SKU / Model",
    desc: "Description",
    quantity: "Quantity",
    unitPrice: "Unit Price",
    total: "Total",
    locationSelect: "Location",
    recentTags: "Recent Tags", // NEW
    cancel: "Cancel",
    save: "Save",
    saveAdd: "Save & Add Another",
    
    // Move
    moveItem: "Move Item",
    moveSelected: "Move Selected Items",
    currentLocation: "Current Location",
    newLocation: "New Location",
    createLocation: "Create New Location",
    optionalNote: "Optional Note",
    
    // Warehouses & Tags
    warehouseLayout: "Warehouse Layout",
    tagManagement: "Tag Management",
    addRoot: "Add Root Location",
    addTag: "Add Tag",
    newLocationName: "New location name...",
    
    confirmDeleteTitle: "Delete Items",
    confirmDeleteMsg: "Permanently delete selected items? This cannot be undone.",
    confirmArchiveTitle: "Archive Items",
    confirmArchiveMsg: "Archive selected items? They will be hidden from the default list.",
    printTips: "Select locations to generate labels for. Labels will be downloaded as PNG images."
  },
  zh: {
    inventory: "库存管理",
    searchPlaceholder: "搜索名称、标签、备注...",
    printLabels: "打印标签",
    addItem: "添加物品",
    import: "导入",
    export: "导出 CSV",
    location: "位置",
    allLocations: "所有位置",
    tags: "标签",
    purchaseDate: "采购日期",
    status: "状态",
    showArchived: "仅显示已归档",
    clearFilters: "重置所有筛选",
    itemsSelected: "项已选择",
    move: "移动",
    archive: "归档",
    unarchive: "还原(解归档)",
    delete: "删除",
    manageWarehouses: "仓库与位置管理",
    manageTags: "标签管理",
    language: "语言",
    switchTo: "English",
    backToInventory: "返回库存列表",
    correctErrors: "请修正高亮显示的字段",

    // Item List
    qty: "数量",
    price: "单价",
    lastUpdated: "最后更新",
    added: "添加时间", // NEW
    edited: "编辑时间", // NEW

    // Dialogs
    editItem: "编辑物品",
    newItem: "新增物品",
    itemName: "物品名称",
    sku: "SKU / 型号",
    desc: "描述/备注",
    quantity: "数量",
    unitPrice: "单价",
    total: "总价",
    locationSelect: "存放位置",
    recentTags: "最近标签", // NEW
    cancel: "取消",
    save: "保存",
    saveAdd: "保存并继续添加",

    // Move
    moveItem: "移动物品",
    moveSelected: "批量移动",
    currentLocation: "当前位置",
    newLocation: "目标位置",
    createLocation: "新建位置",
    optionalNote: "备注 (可选)",

    // Warehouses & Tags
    warehouseLayout: "仓库布局视图",
    tagManagement: "标签管理",
    addRoot: "添加根位置 (仓库)",
    addTag: "添加标签",
    newLocationName: "输入新位置名称...",

    confirmDeleteTitle: "确认删除",
    confirmDeleteMsg: "确定要永久删除选中的物品吗？此操作无法撤销。",
    confirmArchiveTitle: "确认归档",
    confirmArchiveMsg: "确定要归档选中的物品吗？它们将从默认列表中隐藏，但不会被删除。",
    printTips: "选择要生成标签的位置，标签将以PNG图像格式下载。"
  }
};

export type Lang = 'en' | 'zh';
