const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// 1. Patch the main filter buttons (Todos, Asignados, Sin asignar)
const oldMainFilters = `                {['ALL', 'UNASSIGNED', 'OPEN'].map(s => (
                  <button key={s} onClick={() => { setStatusFilter(s); setIsFilterDropdownOpen(false); }} className={\`px-2.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200 \${statusFilter === s ? 'bg-gray-200 text-gray-800 border border-transparent dark:bg-[#0a332c] dark:text-[#00a884]' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-[#202c33] dark:border-transparent dark:text-[#aebac1] dark:hover:bg-[#2A3942]'}\`}>
                    {s === 'ALL' ? 'Todos' : s === 'UNASSIGNED' ? 'Sin asignar' : 'Abiertos'}
                  </button>
                ))}`;
const newMainFilters = `                {['ALL', 'ASSIGNED_TO_ME', 'UNASSIGNED'].map(s => (
                  <button key={s} onClick={() => { setStatusFilter(s); setIsFilterDropdownOpen(false); }} className={\`px-2.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200 \${statusFilter === s ? 'bg-gray-200 text-gray-800 border border-transparent dark:bg-[#0a332c] dark:text-[#00a884]' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-[#202c33] dark:border-transparent dark:text-[#aebac1] dark:hover:bg-[#2A3942]'}\`}>
                    {s === 'ALL' ? 'Todos' : s === 'ASSIGNED_TO_ME' ? 'Asignados' : 'Sin asignar'}
                  </button>
                ))}`;

if (code.includes(oldMainFilters)) {
    code = code.replace(oldMainFilters, newMainFilters);
    console.log('Main filters patched');
} else {
    console.log('Main filters NOT matched');
}

// 2. Patch the dropdown button
const oldDropdownButton = `<button 
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className={\`px-2.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1 \${['PENDING', 'CLOSED'].includes(statusFilter) || isFilterDropdownOpen ? 'bg-gray-200 text-gray-800 border border-transparent dark:bg-[#0a332c] dark:text-[#00a884]' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-[#202c33] dark:border-transparent dark:text-[#aebac1] dark:hover:bg-[#2A3942]'}\`}
                  >
                    {['PENDING', 'CLOSED'].includes(statusFilter) ? (statusFilter === 'PENDING' ? 'Pendientes' : 'Cerrados') : 'Más'}
                    <ChevronDown size={14} className="ml-1" />
                  </button>`;
const newDropdownButton = `<button 
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className={\`px-2.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1 \${['OPEN', 'PENDING', 'CLOSED'].includes(statusFilter) || isFilterDropdownOpen ? 'bg-gray-200 text-gray-800 border border-transparent dark:bg-[#0a332c] dark:text-[#00a884]' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-[#202c33] dark:border-transparent dark:text-[#aebac1] dark:hover:bg-[#2A3942]'}\`}
                  >
                    {['OPEN', 'PENDING', 'CLOSED'].includes(statusFilter) ? (statusFilter === 'OPEN' ? 'Abiertos' : statusFilter === 'PENDING' ? 'Pendientes' : 'Cerrados') : 'Más'}
                    <ChevronDown size={14} className="ml-1" />
                  </button>`;

if (code.includes(oldDropdownButton)) {
    code = code.replace(oldDropdownButton, newDropdownButton);
    console.log('Dropdown button patched');
} else {
    console.log('Dropdown button NOT matched');
}

// 3. Patch the dropdown menu list
const oldDropdownList = `{['PENDING', 'CLOSED'].map(s => (
                        <button
                          key={s}
                          onClick={() => { setStatusFilter(s); setIsFilterDropdownOpen(false); }}
                          className={\`w-full text-left px-4 py-2 text-[13px] transition-colors \${statusFilter === s ? 'bg-gray-100 dark:bg-[#2A3942] text-gray-900 dark:text-white' : 'text-gray-700 dark:text-[#d1d7db] hover:bg-gray-50 dark:hover:bg-[#2A3942]'}\`}
                        >
                          {s === 'PENDING' ? 'Pendientes' : 'Cerrados'}
                        </button>
                      ))}`;
const newDropdownList = `{['OPEN', 'PENDING', 'CLOSED'].map(s => (
                        <button
                          key={s}
                          onClick={() => { setStatusFilter(s); setIsFilterDropdownOpen(false); }}
                          className={\`w-full text-left px-4 py-2 text-[13px] transition-colors \${statusFilter === s ? 'bg-gray-100 dark:bg-[#2A3942] text-gray-900 dark:text-white' : 'text-gray-700 dark:text-[#d1d7db] hover:bg-gray-50 dark:hover:bg-[#2A3942]'}\`}
                        >
                          {s === 'OPEN' ? 'Abiertos' : s === 'PENDING' ? 'Pendientes' : 'Cerrados'}
                        </button>
                      ))}`;

if (code.includes(oldDropdownList)) {
    code = code.replace(oldDropdownList, newDropdownList);
    console.log('Dropdown list patched');
} else {
    console.log('Dropdown list NOT matched');
}

// 4. Patch the filter logic
const oldFilterLogic = `                  if (statusFilter === 'UNASSIGNED' && c.assignedUserId) return false;
                  if (statusFilter !== 'ALL' && statusFilter !== 'UNASSIGNED' && c.status !== statusFilter) return false;
                  return true;`;
const newFilterLogic = `                  if (statusFilter === 'ASSIGNED_TO_ME') {
                    if (c.assignedUserId !== user?.id) return false;
                  } else if (statusFilter === 'UNASSIGNED') {
                    if (c.assignedUserId) return false;
                  } else if (statusFilter !== 'ALL') {
                    if (c.status !== statusFilter) return false;
                  }
                  return true;`;

if (code.includes(oldFilterLogic)) {
    code = code.replace(oldFilterLogic, newFilterLogic);
    console.log('Filter logic patched');
} else {
    console.log('Filter logic NOT matched');
}

fs.writeFileSync('frontend/src/app/page.tsx', code);
