## coub.com 内容抓取

### 运行

修改 `app.js`:

* `time` 为每个分类要抓取内容的时间段。`daily`、`weekly`、 `monthly`、 `quarter`、`half`
* `per_page` 为每页返回的数据条数，最大为25
* `fastMode` 为true时下载速度快，但视频可能出现音频问题。为false时速度慢，视频音频正常。

执行`node app.js`运行代码或使用pm2守护进程：`pm2 start app.js --name 'coub'`。

下载完的视频及JSON文件存储在`downloads`对应目录下，完整日志在`logs`目录。

### 程序说明

1、总共17个分类。

2、数据获取

* url：`https://coub.com/api/v2/timeline/hot/movies/half?per_page=25`
* 说明：`movies` 为分类。 `per_page` 为每页返回的数据量[1,25]。首次获取只需传入 `page=1` 即为第一页的数据。下次请求附带字段 `anchor` 为上次请求返回的 `next` 参数即可。

3、每个资源的属性：

* 唯一标志： id、permalink
* 资源描述： titile


4、下载

coub.com的音频和视频是分开的，下载的时候需要将音视频分别下载，然后使用FFmpeg合并。
下载及合并使用开源项目 `https://github.com/TeeSeal/coub-dl`


5、分类数组

```js
["animals-pets", "mashup", "anime", "movies", "gaming", "cartoons", "art", "music", "sports", "science-technology", "celebrity", "nature-travel", "fashion", "dance", "cars", "nsfw"]
```

6、请求返回数据格式

```js
{
    "page": 1,
    "per_page": 25,
    "total_pages": 8,
    "next": 12663692,
    "coubs": [
        {
            "flag": null,
            "abuses": null,
            "recoubs_by_users_channels": null,
            "favourite": false,
            "recoub": null,
            "like": null,
            "in_my_best2015": false,
            "id": 84085654,
            "type": "Coub::Simple",
            "permalink": "1dnm2b",
            "title": "How to ride",
            "visibility_type": "public",
            "original_visibility_type": "public",
            "channel_id": 4572400,
            "created_at": "2018-09-02T04:09:28Z",
            "updated_at": "2018-09-19T09:03:07Z",
            "is_done": true,
            "views_count": 110268,
            "cotd": null,
            "cotd_at": null,
            "published": true,
            "published_at": "2018-09-02T04:09:28Z",
            "reversed": true,
            "from_editor_v2": true,
            "is_editable": true,
            "original_sound": false,
            "has_sound": false,
            "recoub_to": null,
            "file_versions": {
                "html5": {
                    "video": {
                        "high": {
                            "url": "https://coubsecure-s.akamaihd.net/get/b133/p/coub/simple/cw_file/fa92b77cd25/8bb4c6b9ee76c9b7b3648/muted_mp4_big_size_1535861379_muted_big.mp4",
                            "size": 3059375
                        },
                        "med": {
                            "url": "https://coubsecure-s.akamaihd.net/get/b133/p/coub/simple/cw_file/fa92b77cd25/8bb4c6b9ee76c9b7b3648/muted_mp4_med_size_1535861379_muted_med.mp4",
                            "size": 877351
                        }
                    },
                    "audio": {
                        "high": {
                            "url": "https://coubsecure-s.akamaihd.net/get/b133/p/coub/simple/cw_looped_audio/4d466be3536/557a27d624abf3032d767/high_1535861396_high.mp3",
                            "size": 4194209
                        },
                        "med": {
                            "url": "https://coubsecure-s.akamaihd.net/get/b133/p/coub/simple/cw_looped_audio/4d466be3536/557a27d624abf3032d767/high_1535861396_high.mp3",
                            "size": 4194209
                        }
                    }
                },
                "mobile": {
                    "gifv": "Ahr0Chm6lY9JB3vIC2vJDxjLlxmUywTHBwfPAgqUBMv0l2DLDc9ImtmZl3aVy291yI9ZAw1WBguVy3DFzMLSzs9MytKYyJC3y2qYns84yMi0yZzIowvLnZzJowi3yJm2ndGVz2LMDL8Xntm1odyXmZC5xZiWndK3x2DPzNyUBxa0",
                    "audio": [
                        "https://coubsecure-s.akamaihd.net/get/b133/p/coub/simple/cw_looped_audio/4d466be3536/557a27d624abf3032d767/med_m4a_1535861396_med.m4a",
                        "https://coubsecure-s.akamaihd.net/get/b133/p/coub/simple/cw_looped_audio/4d466be3536/557a27d624abf3032d767/high_1535861396_high.mp3"
                    ]
                }
            },
            "audio_versions": {
                "template": "https://coubsecure-s.akamaihd.net/get/b127/p/audio_track/cw_normalized_copy/c030ec098c2/99af4293448999330b402/mid_1536706207_16ex7y2_normalized_1535861211_audio.mp3",
                "versions": [
                    "mid",
                    "low"
                ],
                "chunks": {
                    "template": "https://coubsecure-s.akamaihd.net/get/b127/p/audio_track/cw_normalized_copy/c030ec098c2/99af4293448999330b402/mp3_%{version}_c%{chunk}_1536706207_16ex7y2_normalized_1535861211_audio.mp3",
                    "versions": [
                        "mid",
                        "low"
                    ],
                    "chunks": [
                        1,
                        2,
                        3,
                        4
                    ]
                }
            },
            "image_versions": {
                "template": "https://coubsecure-s.akamaihd.net/get/b133/p/coub/simple/cw_image/4ebdc8e286a/643e256926c9d08d7e083/%{version}_1535861411_00038.jpg",
                "versions": [
                    "micro",
                    "tiny",
                    "age_restricted",
                    "ios_large",
                    "ios_mosaic",
                    "big",
                    "med",
                    "small",
                    "pinterest"
                ]
            },
            "first_frame_versions": {
                "template": "https://coubsecure-s.akamaihd.net/get/b133/p/coub/simple/cw_timeline_pic/1a0e612c5b9/3cadd8ed1b15cd803cb28/%{version}_1535861410_image.jpg",
                "versions": [
                    "big",
                    "med",
                    "small",
                    "ios_large"
                ]
            },
            "dimensions": {
                "big": [
                    1280,
                    720
                ],
                "med": [
                    640,
                    360
                ]
            },
            "site_w_h": [
                640,
                360
            ],
            "page_w_h": [
                640,
                360
            ],
            "site_w_h_small": [
                310,
                174
            ],
            "age_restricted": false,
            "age_restricted_by_admin": false,
            "not_safe_for_work": false,
            "allow_reuse": false,
            "dont_crop": false,
            "banned": false,
            "global_safe": true,
            "audio_file_url": "https://coubsecure-s.akamaihd.net/get/b127/p/audio_track/cw_normalized_copy/c030ec098c2/99af4293448999330b402/low_1536706207_16ex7y2_normalized_1535861211_audio.mp3",
            "external_download": false,
            "application": null,
            "channel": {
                "id": 4572400,
                "permalink": "d4369596ec4c87b3cc411eba9b29cbdd",
                "title": "Saigofu",
                "description": null,
                "followers_count": 21,
                "following_count": 1,
                "avatar_versions": {
                    "template": "https://coubsecure-s.akamaihd.net/get/b14/p/channel/cw_avatar/33160a13e38/ebc7ba4b1e05d2f64aa6f/%{version}_1533405536_tumblr_inline_n0bl06TqUk1syef2f.png",
                    "versions": [
                        "medium",
                        "medium_2x",
                        "profile_pic",
                        "profile_pic_new",
                        "profile_pic_new_2x",
                        "tiny",
                        "tiny_2x",
                        "small",
                        "small_2x",
                        "ios_large",
                        "ios_small"
                    ]
                }
            },
            "file": null,
            "picture": "https://coubsecure-s.akamaihd.net/get/b133/p/coub/simple/cw_image/4ebdc8e286a/643e256926c9d08d7e083/med_1535861411_00038.jpg",
            "timeline_picture": "https://coubsecure-s.akamaihd.net/get/b133/p/coub/simple/cw_timeline_pic/1a0e612c5b9/3cadd8ed1b15cd803cb28/ios_large_1535861410_image.jpg",
            "small_picture": "https://coubsecure-s.akamaihd.net/get/b133/p/coub/simple/cw_image/4ebdc8e286a/643e256926c9d08d7e083/ios_mosaic_1535861411_00038.jpg",
            "sharing_picture": null,
            "percent_done": 100,
            "tags": [
                {
                    "id": 52997,
                    "title": "horse racing",
                    "value": "horse%20racing"
                },
                {
                    "id": 344904,
                    "title": "horseback riding",
                    "value": "horseback%20riding"
                },
                {
                    "id": 12335,
                    "title": "riding",
                    "value": "riding"
                },
                {
                    "id": 5453,
                    "title": "jennifer connelly",
                    "value": "jennifer%20connelly"
                },
                {
                    "id": 184,
                    "title": "sexy",
                    "value": "sexy"
                },
                {
                    "id": 183,
                    "title": "girl",
                    "value": "girl"
                },
                {
                    "id": 3171,
                    "title": "horse",
                    "value": "horse"
                }
            ],
            "categories": [
                {
                    "id": 19,
                    "title": "Movies & TV",
                    "permalink": "movies",
                    "visible": true
                }
            ],
            "recoubs_count": 357,
            "remixes_count": 5,
            "likes_count": 1786,
            "raw_video_id": "",
            "uploaded_by_ios_app": false,
            "uploaded_by_android_app": false,
            "media_blocks": {
                "uploaded_raw_videos": [],
                "external_raw_videos": [],
                "remixed_from_coubs": [
                    {
                        "id": 27927193,
                        "title": "Racing",
                        "url": "https://coub.com/coubs/1dd7bk/remix",
                        "image": "https://coubsecure-s.akamaihd.net/get/b55/p/media_block/cw_image/e260a04e3b7/89f6b60d8fd7e995476ea/video_1535436309_1535436298_00032.jpg",
                        "image_retina": "https://coubsecure-s.akamaihd.net/get/b55/p/media_block/cw_image/e260a04e3b7/89f6b60d8fd7e995476ea/video_retina_1535436309_1535436298_00032.jpg",
                        "meta": {
                            "duration": "10.0"
                        },
                        "duration": null,
                        "coub_channel_title": "Emma Watson",
                        "coub_channel_permalink": "hermione",
                        "coub_views_count": 220780,
                        "coub_permalink": "1dd7bk"
                    }
                ]
            },
            "raw_video_thumbnail_url": "",
            "raw_video_title": "",
            "video_block_banned": false,
            "duration": 12.08,
            "promo_winner": false,
            "promo_winner_recoubers": null,
            "editorial_info": {},
            "promo_hint": null,
            "beeline_best_2014": null,
            "from_web_editor": true,
            "normalize_sound": true,
            "best2015_addable": false,
            "ahmad_promo": null,
            "promo_data": null,
            "audio_copyright_claim": null,
            "ads_disabled": false,
            "position_on_page": 1
        }
    ]
}
```