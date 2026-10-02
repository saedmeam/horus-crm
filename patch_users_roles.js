const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/admin/users/page.tsx', 'utf8');

// Add roles state
code = code.replace(/const \[users, setUsers\] = useState<any\[\]>\(\[\]\);/, `const [users, setUsers] = useState<any[]>([]);\n  const [roles, setRoles] = useState<any[]>([]);`);

// Fetch roles in useEffect
code = code.replace(/fetchUsers\(\);/, `fetchUsers();\n    fetchRoles();`);
code = code.replace(/const fetchUsers = async \(\) => \{/, `const fetchRoles = async () => {
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001') + '/api/roles', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
    if(res.ok) setRoles(await res.json());
  };
  const fetchUsers = async () => {`);

// Patch Select
code = code.replace(/<select className="w-full[\s\S]*?<\/select>/, `<select className="w-full px-3 py-2 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
  <option value="">-- Seleccionar Rol --</option>
  {roles.map((r: any) => (
    <option key={r.id} value={r.id}>{r.name}</option>
  ))}
</select>`);

// Fix user.role rendering in table
code = code.replace(/user\.role === 'SUPERADMIN'\s*\?.*?}/, "user.role?.name === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}");
code = code.replace(/\{user\.role\}/, "{user.role?.name || user.role}");

// Fix formData role init
code = code.replace(/role: 'SALES'/g, "role: ''");
code = code.replace(/role: user\.role/g, "role: user.roleId || user.role?.id || ''");

fs.writeFileSync('frontend/src/app/admin/users/page.tsx', code);
console.log('Users page patched.');
