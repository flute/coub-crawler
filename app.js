const Coub = require('coub-dl')
const async = require('async')
const fs = require('fs')
const request = require('request')
const path = require('path')

// 数据时期
let time = 'monthly'
// log
const log = require(`./utils/${time}`).getLogger('debug')

// 视频分类，所有分类如下：（去掉news分类共16种分类）
// animals-pets mashup anime movies gaming cartoons art music news sports science-technology
// celebrity nature-travel fashion dance cars nsfw
let categoryArr = ["animals-pets", "mashup", "anime", "movies", "gaming", "cartoons", "art", "music", "sports", "science-technology", "celebrity", "nature-travel", "fashion", "dance", "cars", "nsfw"]
// 是否使用加速模式下载。加速模式会导致一些视频音频出现问题！
let fastMode = false
// 成功下载计数器
let downloadCount = 1
// 总下载耗时
let startTime = new Date()
// 视频描述JSON文件
let dlFilesJson = []
// 视频存储数组
let videoList = []
// 开始抓取
let startPage = 1
let startAnchor = ''
// 每次最多返回25条数据
let per_page = 25
// 存储路径
let dlPath = path.resolve(__dirname, `./${time}/video`);
let jsonPath = path.resolve(__dirname, `./${time}/json`);

mkdirsSync(dlPath)
mkdirsSync(jsonPath)

/**
 * 同步递归创建目录
 * @param {*} dirname 
 */
function mkdirsSync(dirname) {
    //log.info(dirname);  
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

/**
 * 获取视频列表，每次请求返回10个视频
 * @param {number} page 请求的页数
 * @param {number} anchor 保证数据的不重复性
 */
function getCoubVideoList(c, page = 1, anchor, next) {
    if (!c) {
        log.error('category empty', c)
        return next(new Error('category empty'), null)
    }
    var options = {
        method: 'GET',
        url: `https://coub.com/api/v2/timeline/hot/${c}/${time}`,
        //url: `https://coub.com/api/v2/timeline/hot/${c}/half`,
        qs: {
            page: page,
            per_page: per_page
        }
    };
    if (anchor) options.qs.anchor = anchor

    request(options, function (error, response, body) {
        if (error) {
            next(error, null)
            return
        }
        let data = JSON.parse(body)

        if (data && data.coubs && data.coubs.length) {
            log.info(`获取视频列表成功 page ${page}`, data.next, data.coubs.length)
            //videoList.push(data.data)
            videoList = videoList.concat(data.coubs)
            return next(null, c, ++data.page, data.next)
        } else {
            log.info('获取内容为空 page ${page}')
            return next(null, c, ++data.page, data.next)
        }
    });
}

/**
 * 获取指定分类的总页数
 */
const getTotalPage = (c) => {
    var options = {
        method: 'GET',
        url: `https://coub.com/api/v2/timeline/hot/${c}/${time}`,
        //url: `https://coub.com/api/v2/timeline/hot/${c}/half`,
        qs: {
            page: 1,
            per_page: per_page
        }
    };
    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (error) return reject(new Error(error))
            let data = JSON.parse(body)
            if (data && data.total_pages) {
                log.info(`获取${c}总页数成功`, data.total_pages)
                return resolve(data.total_pages)
            } else {
                log.info(`获取${c}总页数失败`)
                return reject(new Error('页数为空'))
            }
        });
    })

}

/**
 * 获取多页的视频
 */
const getMultiVideo = async c => {
    // 总页数
    let totalPage = await getTotalPage(c)
    // 每页依次队列获取
    let actions = [async.constant(c, startPage, startAnchor)]
    for (let i = 1; i <= totalPage; i++) {
        actions.push(getCoubVideoList)
    }
    return new Promise((resolve, reject) => {
        async.waterfall(actions, function (err, result) {
            log.info(`finish crawler ${c} videos`, err, videoList.length)
            if (err) return reject(new Error(err))
            return resolve(videoList)
        })
    })
}

/**
 * 根据视频的permalink下载视频
 * @param {string} id video permalink
 */
async function downloadFile(c, video, next) {
    if (!video || !video.permalink) return next(null, '')
    let id = video.permalink

    let filename = `${dlPath}/${id}.mp4`

    let isExist = isFileExist(id)
    // 文件已存在
    if (isExist) {
        return next(null, filename)
    }

    // 下载操作
    const coub = await Coub.fetch(`http://coub.com/view/${id}`).catch(error => {
        console.log('fetch error', error)
        return next(null, '')
    })
    if (!coub) return next(null, '')
    coub.attachAudio()
    if (fastMode) coub.addOption('-c', 'copy')
    coub.addOption('-shortest')
    let ts = new Date()
    coub.write(filename)
        .then(result => {
            let te = new Date()
            let tu = (te - ts) / 1000
            log.info(`${downloadCount}：finish download ${c} ${id}.mp4`, filename, `用时${tu}s`)
            downloadCount++
            // 视频信息
            let videoInfo = {
                desc: video.title,
                category: c,
                filename: `${id}.mp4`
            }
            // 实时写入json
            saveJsonData(videoInfo)

            dlFilesJson.push(videoInfo)
            return next(null, result)
            //return resolve(result)
        })
        .catch(error => {
            log.error(`download error ${id}.mp4`, error)
            return next(error, '')
            //return reject(error)
        })
}

/**
 * 视频是否已下载
 */
const isFileExist = id => {
    let oldPath = path.resolve(__dirname, `./src/video/${id}.mp4`);
    let newPath = path.resolve(__dirname, `./downloads/video/${id}.mp4`);
    let weeklyPath = path.resolve(__dirname, `./weekly/video/${id}.mp4`);
    let monthlyPath = path.resolve(__dirname, `./monthly/video/${id}.mp4`);
    let quarterPath = path.resolve(__dirname, `./quarter/video/${id}.mp4`);
    let halfPath = path.resolve(__dirname, `./half/video/${id}.mp4`);

    if (fs.existsSync(oldPath)) {
        log.info('file exist', oldPath)
        return true
    } else if (fs.existsSync(newPath)) {
        log.info('file exist', newPath)
        return true
    } else if(fs.existsSync(weeklyPath)){
        log.info('file exist', weeklyPath)
        return true
    } else if(fs.existsSync(monthlyPath)){
        log.info('file exist', monthlyPath)
        return true
    } else if(fs.existsSync(quarterPath)){
        log.info('file exist', quarterPath)
        return true
    } else if(fs.existsSync(halfPath)){
        log.info('file exist', halfPath)
        return true
    } else return false
}

/**
 * 视频下载成功后，实时更新json数据。防止程序中途奔溃后视频信息未保存
 * @param {*} data 
 */
const saveJsonData = data => {
    try {

        // 读取已有json信息
        let jsonFile = `${jsonPath}/all.json`

        let jsonData = []
        if (fs.existsSync(jsonFile)) {
            fileData = fs.readFileSync(jsonFile, {
                encoding: 'utf8'
            })
            if (fileData) {
                jsonData = JSON.parse(fileData)
            }
        }
        // 写入
        jsonData.push(data)
        fs.writeFileSync(jsonFile, JSON.stringify(jsonData));

    } catch (error) {
        log.error('写入json文件失败', data)
    }

}


/**
 * 使用-C模式，将视频与音频快速合并，速度快，但问题视频较多，视频声音不正常。
 * 使用非-C模式，速度较慢，且由于合并时占用cpu较大，多个视频合并任务同时进行时，电脑基本会卡死
 * 最终采用非-C模式，保证每个视频的音频正常。同时为保证电脑不死机，以队列模式依次处理。唯一缺陷是耗时。
 */
async function doDownload(c) {
    let result = await getMultiVideo(c)
    videoList = []
    let data = []
    result.forEach(item => data = data.concat(item))
    log.info(`要抓取的 ${c} 类型的视频总数为 ${data.length} 个`)

    let actions = data.map(video => next => {
        downloadFile(c, video, next)
    })

    return new Promise((resolve, reject) => {
        let st = new Date()
        async.series(actions, function (err, result) {
            let et = new Date()
            let ut = timeUsed((et - st) / 1000)
            log.info(`finish download ${c} video, 耗时 ${ut}`, err, result.length)

            if (err) return reject(new Error(err))
            // 每个分类的json
            fs.writeFileSync(`${jsonPath}/${c}.json`, JSON.stringify(dlFilesJson));
            dlFilesJson = []
            downloadCount = 1
            return resolve(result)
        })
    })

}

async function main() {

    let animals_pets = await doDownload('animals-pets')
    let mashup = await doDownload('mashup')
    let anime = await doDownload('anime')
    let movies = await doDownload('movies')
    let gaming = await doDownload('gaming')
    let cartoons = await doDownload('cartoons')
    let art = await doDownload('art')
    let music = await doDownload('music')
    let news  = await doDownload('news')
    let sports = await doDownload('sports')
    let science_technology = await doDownload('science-technology')
    let celebrity = await doDownload('celebrity')
    let nature_travel = await doDownload('nature-travel')
    let fashion = await doDownload('fashion')
    let dance = await doDownload('dance')
    let cars = await doDownload('cars')
    let nsfw = await doDownload('nsfw')
    
    return true
}

/**
 * 用时显示
 */
const timeUsed = t => {
    // [1s, 1m)
    if (t < 60) return `${Math.round(t)}s`
    // [1m, 1h)
    else if (t >= 60 && t < 60 * 60) return `${Math.floor(t/60)}m${Math.floor(t%60)}s`
    // [1h, 1d)
    else if (t >= 60 * 60 && t < 60 * 60 * 24) return `${Math.floor(t/(60*60))}h${Math.floor(t%(60*60)/60)}m`
    // [1d, ~)
    else return `${ Math.floor(t/(24*60*60)) }d ${ Math.floor( t%(24*60*60)/(60*60) ) }h`
}

main()
    .then(result => {
        let endTime = new Date()
        let usedTime = timeUsed((endTime - startTime) / 1000)
        log.info(`all downloads finish，${result} 个视频，共耗时 ${usedTime}`, )
    })
    .catch(error => {
        log.error('download error', error)
    })
    .then(() => {
        process.exit(0)
    })

process.on('uncaughtException', err => {
    log.info(err)
    log.info(JSON.stringify(dlFilesJson))
})