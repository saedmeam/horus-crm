with open('frontend/src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
start = content.find("newSocket.on('new_message'")
print(content[start:start+2000])
