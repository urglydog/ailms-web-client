with open('/var/lms/fe/components/instructor/CourseMaterialsManager.tsx', 'r') as f:
    lines = f.readlines()

with open('new_component.txt', 'r') as f:
    new_comp_lines = f.readlines()

lines = lines[:15] + new_comp_lines + lines[639:]

with open('/var/lms/fe/components/instructor/CourseMaterialsManager.tsx', 'w') as f:
    f.writelines(lines)
