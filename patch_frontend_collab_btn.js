const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const regex = /<div className="relative">\s*<button \s*onClick=\{\(\) => \{\s*if \(selectedChat\?\.assignedUserId\) \{/g;

const newHeaderBtns = `<div className="relative">
      <button 
        onClick={openCollabModal}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800 mr-2"
        title="Gestionar Colaboradores"
      >
        <Users className="w-4 h-4" />
        <span className="hidden sm:inline">Colaboradores</span>
        {selectedChat?.collaborators?.length > 0 && (
          <span className="bg-indigo-200 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded-full text-xs">
            {selectedChat.collaborators.length}
          </span>
        )}
      </button>
    </div>
    
    <div className="relative">
    <button 
      onClick={() => {
        if (selectedChat?.assignedUserId) {`;

if (code.match(regex)) {
    code = code.replace(regex, newHeaderBtns);
    fs.writeFileSync('frontend/src/app/page.tsx', code);
    console.log('Button inserted successfully');
} else {
    console.log('Regex did not match');
}
