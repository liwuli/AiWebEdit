// 插入悬浮弹窗
function createPanel() {
  if (document.getElementById('ai-edit-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'ai-edit-panel';
  panel.innerHTML = `
    <div id="ai-edit-header">AI网页编辑器 <span id="ai-edit-close">✖</span></div>
    <button id="ai-edit-select">选择节点</button>
    <button id="ai-edit-delete">删除节点</button>
    <div id="ai-edit-selected">未选择节点</div>
    <textarea id="ai-edit-input" placeholder="请输入修改意见"></textarea>
    <button id="ai-edit-submit">提交</button>
    <div id="ai-edit-result"></div>
  `;
  document.body.appendChild(panel);

  // 拖拽功能
  const header = panel.querySelector('#ai-edit-header');
  let isDragging = false, offsetX = 0, offsetY = 0;
  header.style.cursor = 'move';
  header.onmousedown = function(e) {
    isDragging = true;
    offsetX = e.clientX - panel.offsetLeft;
    offsetY = e.clientY - panel.offsetTop;
    document.onmousemove = function(e) {
      if (isDragging) {
        panel.style.left = (e.clientX - offsetX) + 'px';
        panel.style.top = (e.clientY - offsetY) + 'px';
        panel.style.right = '';
      }
    };
    document.onmouseup = function() {
      isDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };

  // 关闭按钮
  document.getElementById('ai-edit-close').onclick = () => panel.remove();

  // 选择节点
  document.getElementById('ai-edit-select').onclick = () => {
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mouseover', highlightNode, true);
    document.addEventListener('mouseout', unhighlightNode, true);
    document.addEventListener('click', selectNode, true);
  };

  // 删除节点
  document.getElementById('ai-edit-delete').onclick = () => {
    const node = window._aiEditNode;
    if (!node) {
      alert('请先选择节点');
      return;
    }
    if (node.tagName === 'HTML' || node.tagName === 'BODY') {
      document.getElementById('ai-edit-result').innerText = '不能删除HTML或BODY节点';
      return;
    }
    if (node.parentNode) {
      node.parentNode.removeChild(node);
      window._aiEditNode = null;
      document.getElementById('ai-edit-selected').innerText = '未选择节点';
      document.getElementById('ai-edit-result').innerText = '节点已删除';
    } else {
      document.getElementById('ai-edit-result').innerText = '无法删除该节点';
    }
  };

  // 提交
  document.getElementById('ai-edit-submit').onclick = async () => {
    const node = window._aiEditNode;
    const advice = document.getElementById('ai-edit-input').value;
    if (!node) {
      alert('请先选择节点');
      return;
    }
    if (node.tagName === 'HTML' || node.tagName === 'BODY') {
      document.getElementById('ai-edit-result').innerText = '不能直接替换HTML或BODY节点';
      return;
    }
    document.getElementById('ai-edit-result').innerText = 'AI处理中...';
    // 组装prompt
    const html = node.outerHTML;    
    debugger
    try {
      const res = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-nqlhihajcnevaouaulvyoxlhoddpvmadlounbudnfvyvsueg'
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
          messages: [
            { role: 'system', content: `你是一个HTML编辑器，我会严格遵循以下规则：
            1. 不要使用任何markdown的标签
            2. 直接返回html富文本
            3. 严格检查返回的内容是否符合html语法` },
            { role: 'user', content: `原始HTML:\n${html}\n用户意见:${advice}` }
          ],
          temperature: 0.2
        })
      });
      const data = await res.json();
      let aiContent = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!aiContent) throw new Error('AI无返回内容');
      aiContent = aiContent && aiContent.replace(/```html|```/gi, '').trim();
      // 尝试提取html和css
      let htmlResult = aiContent;
      let cssResult = '';
      // 简单分割html和css
      const htmlMatch = aiContent.match(/<([\s\S]*?)>/);
      const cssMatch = aiContent.match(/<style[\s\S]*?>[\s\S]*?<\/style>/);
      if (cssMatch) {
        cssResult = cssMatch[0];
        htmlResult = aiContent.replace(cssMatch[0], '').trim();
      }
      // 替换节点
      const temp = document.createElement('div');
      temp.innerHTML = htmlResult + (cssResult ? cssResult : '');
      const newNodes = Array.from(temp.childNodes);
      if (node.parentNode) {
        newNodes.forEach(n => node.parentNode.insertBefore(n, node));
        node.parentNode.removeChild(node);
        document.getElementById('ai-edit-result').innerText = '修改完成';
      } else {
        document.getElementById('ai-edit-result').innerText = '无法替换该节点';
      }
    } catch (err) {
      document.getElementById('ai-edit-result').innerText = 'AI请求失败: ' + err.message;
    }
  };

  const style = document.createElement('style');
  style.innerHTML = `
    #ai-edit-panel {
      position: fixed;
      top: 100px;
      right: 40px;
      width: 340px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      z-index: 999999;
      font-family: 'Segoe UI', 'Arial', sans-serif;
      border: 1px solid #e0e0e0;
      padding-bottom: 16px;
      transition: box-shadow 0.2s;
    }
    #ai-edit-header {
      background: linear-gradient(90deg, #4f8cff 0%, #6fc3ff 100%);
      color: #fff;
      padding: 14px 16px;
      border-radius: 12px 12px 0 0;
      font-size: 18px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      user-select: none;
    }
    #ai-edit-close {
      cursor: pointer;
      font-size: 18px;
      color: #fff;
      transition: color 0.2s;
    }
    #ai-edit-close:hover {
      color: #ff4d4f;
    }
    #ai-edit-select, #ai-edit-delete, #ai-edit-submit {
      background: #4f8cff;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 18px;
      margin: 12px 8px 0 16px;
      font-size: 15px;
      cursor: pointer;
      transition: background 0.2s;
    }
    #ai-edit-select:hover, #ai-edit-delete:hover, #ai-edit-submit:hover {
      background: #357ae8;
    }
    #ai-edit-selected {
      margin: 10px 16px 0 16px;
      color: #888;
      font-size: 14px;
    }
    #ai-edit-input {
      width: calc(100% - 32px);
      margin: 12px 16px 0 16px;
      min-height: 60px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      padding: 8px;
      font-size: 15px;
      resize: vertical;
      outline: none;
      transition: border 0.2s;
    }
    #ai-edit-input:focus {
      border: 1.5px solid #4f8cff;
    }
    #ai-edit-result {
      margin: 14px 16px 0 16px;
      min-height: 22px;
      color: #4f8cff;
      font-size: 15px;
      word-break: break-all;
    }
    #ai-edit-delete {
      background: #ff4d4f;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 18px;
      margin: 12px 8px 0 16px;
      font-size: 15px;
      cursor: pointer;
      transition: background 0.2s;
    }
    #ai-edit-delete:hover {
      background: #d9363e;
    }
  `;
  document.head.appendChild(style);
}

// 高亮节点
function highlightNode(e) {
  if (!e.target.closest('#ai-edit-panel')) {
    e.target.__oldOutline = e.target.style.outline;
    e.target.style.outline = '2px solid #4f8cff';
  }
}
function unhighlightNode(e) {
  if (!e.target.closest('#ai-edit-panel') && e.target.__oldOutline !== undefined) {
    e.target.style.outline = e.target.__oldOutline;
    delete e.target.__oldOutline;
  }
}

// 节点选择逻辑
function selectNode(e) {
  e.preventDefault();
  e.stopPropagation();
  document.body.style.cursor = '';
  document.removeEventListener('mouseover', highlightNode, true);
  document.removeEventListener('mouseout', unhighlightNode, true);
  document.removeEventListener('click', selectNode, true);
  window._aiEditNode = e.target;
  e.target.style.outline = '2px solid red';
  document.getElementById('ai-edit-selected').innerText = e.target.tagName;
  document.getElementById('ai-edit-input').value = '';
  setTimeout(() => { e.target.style.outline = ''; }, 1000);
}

// 监听插件激活
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'open_panel') createPanel();
}); 