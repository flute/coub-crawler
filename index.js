const Coub = require('coub-dl')

/* const init = async () => {
    const coub = await Coub.fetch('http://coub.com/view/w6uc9')
    coub.attachAudio()

    //coub.addOption('-c', 'copy')
    coub.addOption('-shortest')

    coub.write('wc.mp4')
    .then(result => {
        console.log('finish',result)
    })
    .catch(error => {
        console.error('error', error)
    })
}

init()
.then(res => {
    console.log('res', res)
})
.catch(e => {
    console.log('e', e)
}) */


let pageCount = 10
let category = 'gaming'
let downloadCount = 1
// animals-pets mashup anime movies gaming cartoons art music news sports science-technology celebrity nature-travel
// fashion dance cars nsfw

const getCoubVideoList = (page) => {
    var request = require("request");

    var options = {
        method: 'GET',
        url: `https://coub.com/api/v2/timeline/hot/${category}/quarter`,
        qs: {
            page: page
        }
    };

    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (error) return reject(new Error(error))
            let data = JSON.parse(body)
            return resolve(data.coubs)
        });
    })
}

const getMultiVideo = () => {
    let actions = []
    for(let i=1;i<=pageCount;i++){
        actions.push( getCoubVideoList(i) )
    }
    return Promise.all(actions)
}

const downloadFile = async id => {
    const coub = await Coub.fetch(`http://coub.com/view/${id}`)
    coub.attachAudio()

    coub.addOption('-c', 'copy')
    coub.addOption('-shortest')

    return new Promise((resolve, reject) => {
        coub.write(`./downloads/${id}.mp4`)
        .then(result => {
            console.log(`${downloadCount}：finish download ${id}.mp4`,result)
            downloadCount ++
            return resolve(result)
        })
        .catch(error => {
            console.error('download error ${id}.mp4', error)
            return reject(error)
        })
    })
}

async function main(){
    let result = await getMultiVideo()
    let data = []
    result.forEach(item => data = data.concat(item))
    
    console.log(data.length)
    let actions = data.map(video => downloadFile(video.permalink))
    return Promise.all(actions)
}

main()
.then(result => {
    console.log('all downloads finish', result)
})
.catch(error => {
    console.error('download error', error)
})