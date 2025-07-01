import { getOrCreateBrowser } from './server'

export async function publishToWeibo(publishInfo): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    console.log('开始执行微博发布操作，参数:', publishInfo)
    const browser = await getOrCreateBrowser()
    const page = await browser.newPage()
    console.log('新页面创建成功')

    // 打开微博发布页面（此处为示例URL，后续可替换为实际发布入口）
    await page.goto('https://weibo.com')
    console.log('已打开微博页面')

    // 查找 title="发微博" 的按钮并点击
    // await page.waitForSelector('button[title="发微博"]', { timeout: 10000 })
    // await page.click('button[title="发微博"]')
    // console.log('已点击发微博按钮')

    // 等待文件选择器出现
    await page.waitForSelector('input[type="file"]', { timeout: 10000 })
    console.log('找到文件选择器')
    const fileInput = await page.$('input[type="file"]')
    if (!fileInput) {
      throw new Error('未找到文件选择器')
    }

    // 上传所有图片（如有多张）
    const { join: pathJoin } = await import('path')
    const fs = await import('fs')
    if (publishInfo.images && Array.isArray(publishInfo.images)) {
      for (const imageUrl of publishInfo.images) {
        try {
          // 下载图片到临时目录
          const tempDir = pathJoin(process.cwd(), 'temp')
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
          }
          const response = await fetch(imageUrl)
          if (!response.ok) {
            throw new Error(`下载图片失败: ${response.statusText}`)
          }
          const buffer = await response.arrayBuffer()
          const tempPath = pathJoin(tempDir, `${Date.now()}_weibo.jpg`)
          await fs.promises.writeFile(tempPath, Buffer.from(buffer))
          await fileInput.uploadFile(tempPath)
          console.log('已上传图片:', imageUrl)
          await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)))
          await fs.promises.unlink(tempPath).catch(err => {
            console.warn('删除临时文件失败:', err)
          })
        } catch (error) {
          console.error(`处理图片 ${imageUrl} 时出错:`, error)
          throw error
        }
      }
    }

    // 填写正文内容到 class 以 Form_input_ 开头的 textarea
    const contentSelector = 'textarea[class^="Form_input_"]'
    await page.waitForSelector(contentSelector, { timeout: 10000 })
    await page.type(contentSelector, publishInfo.content || '')
    console.log('已填写正文内容')

    // 点击 class 以 Tool_check_ 开头的元素下的 button 作为发送
    const sendButtonSelector = '[class^="Tool_check_"] button'
    await page.waitForSelector(sendButtonSelector, { timeout: 10000 })
    await page.click(sendButtonSelector)
    console.log('已点击发送按钮')

    // TODO: 等待并填写内容、上传图片、点击发布按钮
    // 这里需要根据微博实际页面结构补充选择器和操作
    // 例如：
    // await page.waitForSelector('textarea[placeholder*="分享"]')
    // await page.type('textarea[placeholder*="分享"]', publishInfo.content || '')
    // ...

    // mock等待发布
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)))

    // 发布成功，返回结果
    return { success: true, message: '微博发布成功' }
  } catch (error) {
    console.error('微博发布过程出错:', error)
    return { success: false, message: error?.message || '未知错误', data: error }
  }
} 