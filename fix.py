with open('/var/lms/fe/components/instructor/CourseMaterialsManager.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if 'const toggleMindmapMutation =' in line or 'const toggleFlashcardMutation =' in line or 'const toggleQuizOfficialMutation =' in line:
        skip = True
    elif skip and '});' in line:
        skip = False
        continue
    
    if skip:
        continue
        
    if 'const mat = materials?.find(m => m.id === confirmDeleteId);' in line:
        continue
        
    new_lines.append(line)

with open('/var/lms/fe/components/instructor/CourseMaterialsManager.tsx', 'w') as f:
    f.writelines(new_lines)
