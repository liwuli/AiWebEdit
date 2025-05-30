// 插入悬浮弹窗
function createPanel() {
  if (document.getElementById('ai-edit-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'ai-edit-panel';
  panel.innerHTML = `
    <div id="ai-edit-header">AI网页编辑器 <span id="ai-edit-close">✖</span></div>
    <button id="ai-edit-select">选择节点</button>
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
  setTimeout(() => { e.target.style.outline = ''; }, 1000);
}

// 监听插件激活
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'open_panel') createPanel();
}); 