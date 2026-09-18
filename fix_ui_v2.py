import re

with open('/var/lms/fe/components/instructor/CourseMaterialsManager.tsx', 'r') as f:
    content = f.read()

# Remove the filtering logic
content = re.sub(
    r"  // Lọc theo selectedTarget[\s\S]*?displayedMaterials = displayedMaterials\.filter\(m => m\.lessonId === selectedTarget\.id\);\n  }",
    "  let displayedMaterials = materials || [];",
    content
)

# Remove selectedTarget state
content = re.sub(
    r"  const \[selectedTarget, setSelectedTarget\] = useState.*?;\n",
    "",
    content
)

# Left pane changes
left_pane_start = content.find('{/* LEFT PANE: Curriculum Tree */}')
left_pane_end = content.find('{/* RIGHT PANE: Master Vault */}')

left_pane_code = """      {/* LEFT PANE: Curriculum Tree */}
      <div className="w-1/3 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-500" />
          <h3 className="font-bold text-sm text-gray-700">Phân Phối (Shortcuts)</h3>
        </div>
        <div className="overflow-y-auto p-2 flex flex-col gap-1 flex-1">
          {chapters?.map(chapter => {
            const chapterMaterials = materials?.filter(m => m.chapterId === chapter.id) || [];
            
            return (
              <div key={chapter.id} className="mt-2">
                <div className="flex w-full items-center gap-2 px-2 py-1.5 text-xs font-bold text-gray-800 bg-gray-50 rounded-md">
                  <span>📁</span> Chương: {chapter.title}
                </div>
                
                {/* Render chapter shortcuts */}
                {chapterMaterials.map(mat => (
                  <div key={`mat-${mat.id}`} className="flex items-center gap-2 px-2 py-1 text-xs text-gray-600 pl-6 hover:bg-blue-50 rounded-md cursor-pointer transition-colors" title="Nháy đúp để xem trước, nháy đơn để chọn gỡ phân phối">
                    <span className="text-[10px]">🔗</span> {mat.title || 'Học liệu'}
                  </div>
                ))}
                
                <div className="flex flex-col gap-1 mt-1 ml-2">
                  {chapter.lessons.map(lesson => {
                    const lessonMaterials = materials?.filter(m => m.lessonId === lesson.id) || [];
                    return (
                      <div key={lesson.id} className="border-l border-gray-100 pl-2">
                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-50/50 rounded-md mt-1">
                          <span>📄</span> {lesson.title}
                        </div>
                        {/* Render lesson shortcuts */}
                        {lessonMaterials.map(mat => (
                          <div key={`mat-${mat.id}`} className="flex items-center gap-2 px-2 py-1 text-[11px] text-gray-600 pl-6 hover:bg-blue-50 rounded-md cursor-pointer transition-colors" title="Nháy đúp để xem trước, nháy đơn để chọn gỡ phân phối">
                            <span className="text-[10px]">🔗</span> {mat.title || 'Học liệu'}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

"""

content = content[:left_pane_start] + left_pane_code + content[left_pane_end:]

# Update the right pane onDoubleClick
content = content.replace(
    """if (selectedTarget.type !== 'WORKSPACE') {
                    toast.error("Đây là bản phân phối. Vui lòng mở file gốc tại Kho Lưu Trữ Chung (Pane Phải) để chỉnh sửa nội dung.");
                  } else {
                    setInspectGenerationId(mat.id);
                  }""",
    "setInspectGenerationId(mat.id);"
)
content = content.replace(
    """${selectedTarget.type !== 'WORKSPACE' ? 'hover:border-purple-300' : 'hover:border-blue-300'}""",
    "hover:border-blue-300"
)
content = content.replace(
    """{selectedTarget.type === 'WORKSPACE' && (
                      <button className="text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    )}""",
    """<button className="text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                        <MoreVertical className="w-4 h-4" />
                      </button>"""
)

with open('/var/lms/fe/components/instructor/CourseMaterialsManager.tsx', 'w') as f:
    f.write(content)
