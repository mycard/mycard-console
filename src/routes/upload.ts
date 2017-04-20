import {Context} from 'koa';
import {OSS} from 'aliyun-sdk';
import * as busboy from 'async-busboy';
import * as  mime from 'mime';
import * as uuid from 'uuid';
import * as Client from 'aliyun-oss-upload-stream';
import * as fs from 'fs-extra-promise'
import * as path from 'path'
import * as Aria2 from 'aria2'
import {bundle} from '../../package/main'
import {mongodb} from '../models/iridium'
import {toObjectID} from 'iridium'
import config from '../../config'

// const Aria2Options = {
//   host: 'localhost',
//   port: 6800,
//   secure: false,
//   secret: '',
//   path: path.join(__dirname, '../../test/upload')
// }

const checkExtension = async (file) => {
  const ext = mime.extension(file.mime);
  if (['zip', 'gz', 'rar', '7z'].indexOf(ext) === -1) {
    throw new Error('Unsupported file type');
  }
}

import Router = require('koa-router');
const ossStream = Client(new OSS({
  accessKeyId: process.env["OSS_ACCESS_ID"],
  secretAccessKey: process.env["OSS_ACCESS_KEY"],
  endpoint: process.env["OSS_ENDPOINT"],
  apiVersion: '2013-10-15'
}));
const router = new Router()

const UploadImage = async (ctx: Context) => {

  try {
    const {files} = await busboy(ctx.req);
    ctx.body = await Promise.all(files.map(async file => {

      await checkExtension(file)

      const filename = `test/${uuid.v1()}`;

      const upload = ossStream.upload({
        Bucket: process.env["OSS_BUCKET"],
        Key: filename,
        ContentType: file.mimeType
      });

      file.pipe(upload);

      return await new Promise((resolve, reject) => {
        upload.on('error', reject);
        upload.on('uploaded', resolve);
      });
    }));
  } catch (err) {
    ctx.throw(403, err);
  }
};

export const UploadPackage = async (ctx: Context) => {
  try {
    const {files} = await busboy(ctx.req);
    ctx.body = await Promise.all(files.map(async file => {

      const ext = mime.extension(file.mime);
      if (['zip', 'gz', 'rar', '7z'].indexOf(ext) === -1) {
        throw new Error('Unsupported file type');
      }

      const filename = uuid.v1()

      const archive_path = path.join(__dirname, '../../test/upload')
      await fs.ensureDirAsync(archive_path)

      const archive = fs.createWriteStream(path.join(archive_path, filename))

      let pack = await mongodb.Packages.findOne({_id: toObjectID(ctx.params.id)})

      return await new Promise((resolve, reject) => {

        file.pipe(archive)

        file.on('close', async() => {



          try {
            pack.status = 'uploading'
            await pack.save()

            resolve(pack)
            // 上传完， 打包
            const bundled = await bundle(filename)

            Object.assign(pack, bundled)
            pack.status = 'uploaded'

            await mongodb.Packages.update({id: pack.id}, {$set: { status: 'deprecated' }}, {multi: true})
            await pack.save()

            // 打包完，上传阿里云

          } catch (e) {
            pack.status = 'failed'
            await pack.save()
          }
        })
        
        file.on('error', async (error) => {
          pack.status = 'failed'
          await pack.save()

          reject(error)
        })
      })

    }));
  } catch (err) {
    ctx.throw(403, err);
  }
}


const uploadPackageUrl = async (ctx: Context) => {
  if(!ctx.request.body.url) {
    ctx.throw(400, "params error")
  }
  //testUrl: https://r.my-card.in/release/dist/0c16a3ecb115fd7cf575ccdd64f62a8f3edc635b087950e4ed4f3f781972bbfd.tar.gz

  const downloader = new Aria2
  let pack = await mongodb.Packages.findOne({_id: toObjectID(ctx.request.body._id)})


  await downloader.open()

  downloader.onDownloadStart = async() => {
    pack.status = 'uploading'
    await pack.save()
  }

  downloader.onDownloadComplete = async(m) => {
    const { files } = await downloader.send('tellStatus', m.gid)
    const [file] = files

    try {
      await checkExtension(file)

      // 打包
      const bundled = await bundle(path.basename(file.path))

      // 打包完， 上传阿里云
      pack.files = bundled.files
      pack.status = 'uploaded'
      await pack.save()

    } catch (e) {
      pack.status = 'failed'
      await pack.save()
    }
  }

  downloader.onDownloadError = async(err) => {
    // console.log(await downloader.send('tellStatus', err.gid))
    pack.status = 'failed'
    await pack.save()
  }


  ctx.body = await new Promise((resolve, reject) => {

    downloader.onmessage = m => {
      if(m["error"]) {
        reject(m["error"])
      } else {
        resolve(m)
      }
    }

    downloader.send('addUri', [ctx.request.body.url], {dir: config.upload_path})
  })

}

router.post('/v1/upload/image', UploadImage)

router.post('/v1/upload/package/:id', UploadPackage)

router.post('/v1/upload/packageUrl', uploadPackageUrl)

export default router
