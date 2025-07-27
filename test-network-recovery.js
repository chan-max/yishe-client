#!/usr/bin/env node

/*
 * 网络恢复功能测试脚本
 * 用于测试连接管理器和网络监控功能
 */

const {
    connectionManager
} = require('./dist/main/connectionManager');
const {
    networkMonitor
} = require('./dist/main/networkMonitor');

console.log('🧪 开始测试网络恢复功能...\n');

// 测试连接管理器
async function testConnectionManager() {
    console.log('📊 测试连接管理器...');

    // 获取初始状态
    const initialStatus = connectionManager.getStatus();
    console.log('初始状态:', initialStatus);

    // 获取配置
    const config = connectionManager.getConfig();
    console.log('配置:', config);

    // 测试配置更新
    connectionManager.updateConfig({
        retryDelay: 1000,
        maxRetries: 3
    });

    console.log('✅ 连接管理器测试完成\n');
}

// 测试网络监控
async function testNetworkMonitor() {
    console.log('🌐 测试网络监控...');

    // 获取初始状态
    const initialStatus = networkMonitor.getStatus();
    console.log('初始状态:', initialStatus);

    // 获取配置
    const config = networkMonitor.getConfig();
    console.log('配置:', config);

    // 测试配置更新
    networkMonitor.updateConfig({
        checkInterval: 15000,
        maxFailures: 2
    });

    console.log('✅ 网络监控测试完成\n');
}

// 测试事件监听
function testEventListeners() {
    console.log('🎯 测试事件监听...');

    // 连接管理器事件
    connectionManager.on('connected', () => {
        console.log('✅ 连接成功事件触发');
    });

    connectionManager.on('error', (error) => {
        console.log('❌ 连接错误事件触发:', error.message);
    });

    connectionManager.on('reconnecting', () => {
        console.log('🔄 重连事件触发');
    });

    connectionManager.on('statusChanged', (status) => {
        console.log('📊 状态变化事件触发:', status);
    });

    // 网络监控事件
    networkMonitor.on('networkLost', (status) => {
        console.log('🌐 网络丢失事件触发:', status);
    });

    networkMonitor.on('networkRestored', (status) => {
        console.log('🌐 网络恢复事件触发:', status);
    });

    networkMonitor.on('statusChanged', (status) => {
        console.log('🌐 网络状态变化事件触发:', status);
    });

    console.log('✅ 事件监听测试完成\n');
}

// 模拟网络问题
async function simulateNetworkIssues() {
    console.log('🔧 模拟网络问题...');

    // 模拟连接检查失败
    console.log('模拟连接检查失败...');
    connectionManager.emit('error', new Error('Protocol error: Connection closed'));

    // 等待一段时间
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 模拟网络恢复
    console.log('模拟网络恢复...');
    networkMonitor.emit('networkRestored', {
        isOnline: true,
        lastCheck: new Date(),
        consecutiveFailures: 0,
        latency: 100
    });

    console.log('✅ 网络问题模拟完成\n');
}

// 主测试函数
async function runTests() {
    try {
        await testConnectionManager();
        await testNetworkMonitor();
        testEventListeners();
        await simulateNetworkIssues();

        console.log('🎉 所有测试完成！');

        // 清理资源
        await connectionManager.cleanup();
        await networkMonitor.cleanup();

    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error);
    }
}

// 运行测试
runTests();