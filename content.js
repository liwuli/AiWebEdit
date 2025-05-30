// 插入悬浮弹窗
function createPanel() {
  if (document.getElementById('ai-edit-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'ai-edit-panel';
  panel.innerHTML = `
    <div id="ai-edit-header">AI网页编辑器 
      <span id="ai-edit-config" title="配置">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </span>
      <span id="ai-edit-close">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </span>
    </div>
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
    if (!node) {
      document.getElementById('ai-edit-result').innerText = '请先选择节点';
      return;
    }
    const advice = document.getElementById('ai-edit-input').value.trim();
    if (!advice) {
      document.getElementById('ai-edit-result').innerText = '请输入修改意见';
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
      const res = await fetch(localStorage.getItem('ai-edit-url')||'https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('ai-edit-key')||'')
        },
        body: JSON.stringify({
          model: localStorage.getItem('ai-edit-model')||'Qwen/Qwen2.5-Coder-32B-Instruct',
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

  // 配置按钮逻辑
  document.getElementById('ai-edit-config').onclick = () => {
    if (document.getElementById('ai-edit-config-panel')) return;
    const configPanel = document.createElement('div');
    configPanel.id = 'ai-edit-config-panel';
    configPanel.innerHTML = `
      <div style="font-weight:bold;font-size:18px;margin-bottom:18px;text-align:center;letter-spacing:2px;">AI编辑器配置</div>
      <div style="margin-bottom:16px;">
        <label style='font-size:14px;color:#333;margin-bottom:4px;display:block;'>API Key</label>
        <input id="ai-edit-config-key" type="text" style="width:100%;margin-top:2px;padding:8px 10px;border-radius:6px;border:1px solid #e0e0e0;font-size:15px;outline:none;transition:border 0.2s;" value="${localStorage.getItem('ai-edit-key')||''}">
      </div>
      <div style="margin-bottom:16px;">
        <label style='font-size:14px;color:#333;margin-bottom:4px;display:block;'>请求地址</label>
        <input id="ai-edit-config-url" type="text" style="width:100%;margin-top:2px;padding:8px 10px;border-radius:6px;border:1px solid #e0e0e0;font-size:15px;outline:none;transition:border 0.2s;" value="${localStorage.getItem('ai-edit-url')||'https://api.siliconflow.cn/v1/chat/completions'}">
      </div>
      <div style="margin-bottom:22px;">
        <label style='font-size:14px;color:#333;margin-bottom:4px;display:block;'>模型ID</label>
        <input id="ai-edit-config-model" type="text" style="width:100%;margin-top:2px;padding:8px 10px;border-radius:6px;border:1px solid #e0e0e0;font-size:15px;outline:none;transition:border 0.2s;" value="${localStorage.getItem('ai-edit-model')||'Qwen/Qwen2.5-Coder-32B-Instruct'}">
      </div>
      <div style='text-align:right;'>
        <button id="ai-edit-config-save" style="background:#4f8cff;color:#fff;border:none;border-radius:6px;padding:8px 28px;font-size:15px;cursor:pointer;box-shadow:0 2px 8px rgba(79,140,255,0.08);transition:background 0.2s;">保存</button>
        <button id="ai-edit-config-cancel" style="margin-left:12px;background:#888;color:#fff;border:none;border-radius:6px;padding:8px 28px;font-size:15px;cursor:pointer;transition:background 0.2s;">取消</button>
      </div>
    `;
    configPanel.style.position = 'fixed';
    configPanel.style.top = '155px';
    configPanel.style.right = '40px';
    configPanel.style.width = '340px';
    configPanel.style.background = '#fff';
    configPanel.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    configPanel.style.borderRadius = '12px';
    configPanel.style.zIndex = '1000000';
    configPanel.style.padding = '18px 18px 12px 18px';
    configPanel.style.border = '1px solid #e0e0e0';
    document.body.appendChild(configPanel);
    document.getElementById('ai-edit-config-cancel').onclick = () => configPanel.remove();
    document.getElementById('ai-edit-config-save').onclick = () => {
      localStorage.setItem('ai-edit-key', document.getElementById('ai-edit-config-key').value);
      localStorage.setItem('ai-edit-url', document.getElementById('ai-edit-config-url').value);
      localStorage.setItem('ai-edit-model', document.getElementById('ai-edit-config-model').value);
      configPanel.remove();
    };
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
    #ai-edit-config {
      position: absolute;
      right:40px;
      color: #fff;
      font-size: 18px;
      cursor: pointer;
      margin-right: 8px;
      margin-left: 0;
      transition: color 0.2s;
    }
    #ai-edit-config:hover {
      color: #4f8cff;
    }
    #ai-edit-delete {
      margin-right: 25px;
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