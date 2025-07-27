/**
 * 测试协议错误弹窗功能
 * 使用方法：在Electron应用运行时执行此脚本
 */

const {
    dialog
} = require('electron');

// 模拟协议错误弹窗
async function testProtocolErrorDialog() {
    try {
        const result = await dialog.showMessageBox({
            type: 'warning',
            buttons: ['关闭客户端', '稍后重试', '取消'],
            defaultId: 0,
            cancelId: 2,
            title: '连接错误',
            message: '检测到浏览器连接协议错误',
            detail: '建议关闭客户端后重新启动以恢复连接。\n\n错误类型：Protocol error: Connection closed\n\n如果问题持续存在，请检查网络连接或联系技术支持。'
        });

        console.log('用户选择:', result.response);
        console.log('按钮文本:', result.response === 0 ? '关闭客户端' : result.response === 1 ? '稍后重试' : '取消');

        switch (result.response) {
            case 0: // 关闭客户端
                console.log('用户选择关闭客户端');
                break;
            case 1: // 稍后重试
                console.log('用户选择稍后重试');
                break;
            case 2: // 取消
                console.log('用户取消操作');
                break;
        }
    } catch (error) {
        console.error('显示协议错误弹窗失败:', error);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    console.log('测试协议错误弹窗功能...');
    testProtocolErrorDialog();
}

module.exports = {
    testProtocolErrorDialog
};