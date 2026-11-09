import re

with open('/var/lms/fe/components/instructor/CourseMaterialsManager.tsx', 'r') as f:
    content = f.read()

# Fix cursor on DraggableMaterialCard
old_cursor = "className={`relative border bg-white rounded-lg flex flex-col overflow-hidden group hover:shadow-md transition-all cursor-pointer ${isDragging ? 'opacity-50 border-blue-400 border-dashed' : 'border-gray-200 hover:border-blue-300'}`}"
new_cursor = "className={`relative border bg-white rounded-lg flex flex-col overflow-hidden group hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 border-blue-400 border-dashed' : 'border-gray-200 hover:border-blue-300'}`}"
content = content.replace(old_cursor, new_cursor)

# Fix ConfirmAction double click issues
# Since confirmAction has no isLoading, we can just clear it immediately so it disappears and can't be clicked again, wait, it IS cleared:
# setConfirmAction(null);
# Why did it double click? If they double click fast, the state might not update fast enough.
# Let's add a simple check in onConfirm.

old_onconfirm = """                <button onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all">Xác nhận</button>"""
new_onconfirm = """                <button 
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    if (btn.disabled) return;
                    btn.disabled = true;
                    btn.innerHTML = 'Đang xử lý...';
                    confirmAction.onConfirm();
                    setTimeout(() => setConfirmAction(null), 100);
                  }} 
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  Xác nhận
                </button>"""
content = content.replace(old_onconfirm, new_onconfirm)

with open('/var/lms/fe/components/instructor/CourseMaterialsManager.tsx', 'w') as f:
    f.write(content)

with open('/var/lms/fe/components/instructor/MaterialFolderTree.tsx', 'r') as f:
    content = f.read()

# Fix create folder expanding parent
old_create_mutation = """    const createFolderMutation = useMutation({
      mutationFn: (vars: { name: string, parentId?: number }) => materialsApi.createFolder(courseId, vars.name, vars.parentId),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructor-folders', courseId] }),
    });"""
new_create_mutation = """    const createFolderMutation = useMutation({
      mutationFn: (vars: { name: string, parentId?: number }) => materialsApi.createFolder(courseId, vars.name, vars.parentId),
      onSuccess: (_, vars) => {
        if (vars.parentId) {
          setExpandedFolders(prev => ({ ...prev, [vars.parentId!]: true }));
        }
        queryClient.invalidateQueries({ queryKey: ['instructor-folders', courseId] });
      },
    });"""
content = content.replace(old_create_mutation, new_create_mutation)

with open('/var/lms/fe/components/instructor/MaterialFolderTree.tsx', 'w') as f:
    f.write(content)

