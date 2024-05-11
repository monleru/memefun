import axios,{AxiosInstance,AxiosError} from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { getJPG } from './utils/get-jpg';
import path from 'path'
import chalk from 'chalk';
import {SocksProxyAgent} from 'socks-proxy-agent';
import { v4 as uuidv4 } from 'uuid';

interface TokenData {
    refresh_token: string;
    access_token: string;
    caid: string;
    proxy: string
};

const log = console.log;

const getAccData = async (acc:string):Promise<TokenData> => {
    const data = JSON.parse(await fs.promises.readFile('tokens.json','utf-8'))
    return data[acc]
}

const getPoints = async (axios_:AxiosInstance,acc:string) => {
    const data = await axios_.get("user/me")
    log(chalk.blue(acc + ":"), "points -",data.data.stats.points)
    log(chalk.blue(acc + ":"), "Is bot -",data.data.isBotUser)
}

const spin = async (axios_:AxiosInstance,acc:string) => {
    const roomID = '0x5c375b8eb20f9414cb3ff47a1bf21bc2062282f96c5a02f182f0c5aecc22cc02'
    const response = await axios_.get(`points/${roomID}/wheel`)
    log(chalk.blue(acc + ":"), "spin available:",response.data.eligible)
    if(response.data.eligible) {
        const response = await axios_.post(`points/${roomID}/wheel/spin`,{})
        log(chalk.blue(acc + ":"), "win points:",response.data.finalPointsWon)
    }
}

const refreshToken = async (axios_:AxiosInstance, acc:string) => {
    const data = JSON.parse(await fs.promises.readFile("tokens.json",'utf-8'))
    const {refresh_token, access_token,caid,proxy} = await getAccData(acc)
    log(chalk.blue(acc + ":"), "refresh session")

    const response = await axios_.post('https://auth.privy.io/api/v1/sessions',{
        refresh_token
    },{
        headers: {
            "Privy-App-Id": "clnjqpsk003stlc0fczrtpy4v",
            "Origin": "https://meme.fun",
            "Authorization": `Bearer ${access_token}`,
            "Privy-Ca-Id": caid,
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-GB,en;q=0.9',
            'Connection': 'keep-alive',
            "Sec-Ch-Ua-Platform": "macOS",
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua": `Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99`,
            "Priority": "u=1, i",
            "Referer": "https://meme.fun/",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'"
        }
    })

    data[acc] = {
        access_token: response.data.token,
        refresh_token: response.data.refresh_token,
        caid,
        proxy
    }
    fs.promises.writeFile('tokens.json',JSON.stringify(data))
    log(chalk.blue(acc + ":"), "refresh success")
    return response.data.token
}

const likePosts = async (axios_:AxiosInstance,acc:string) => {
    const data = await axios_.get("ticker/0x5c375b8eb20f9414cb3ff47a1bf21bc2062282f96c5a02f182f0c5aecc22cc02/posts?sort=recent")
    const posts = data.data.posts
    for (const post of posts) {
        if (post.userVote === null) {
            await axios_.post(`ticker/0x5c375b8eb20f9414cb3ff47a1bf21bc2062282f96c5a02f182f0c5aecc22cc02/post/${post.id}/vote`,
                {upvote: true}
            )
            log(chalk.blue(acc + ":"), "like meme")
            await sleep(0.05,0.15)
        }
    }
}

export async function post(acc:string) {
    log(chalk.blue(acc + ":"), "work start")

    const formData = new FormData();
    const path_ = await getJPG()
    const avatarFileContent = await fs.promises.readFile(path_);
    formData.append('file', avatarFileContent, {
        filename: `${uuidv4()}.jpg`,
        contentType: 'image/jpeg',
    });
    const { proxy } = await getAccData(acc)
    let httpsAgent =  new SocksProxyAgent(`socks5://${proxy}`)
    let httpAgent = httpsAgent

    const axios_ = axios.create({
        baseURL: 'https://api.meme.fun',
        headers: {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-GB,en;q=0.9',
            'Connection': 'keep-alive',
            "Sec-Ch-Ua-Platform": "macOS",
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua": `Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99`,
            "Priority": "u=1, i",
            "Referer": "https://meme.fun/",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
        },
        timeout: 5000,
        httpAgent,
        httpsAgent
    }
        
    )

    axios_.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    axios_.defaults.headers.common['X-Privy-Token'] =  await refreshToken(axios_,acc)

    const url = '/ticker/0x5c375b8eb20f9414cb3ff47a1bf21bc2062282f96c5a02f182f0c5aecc22cc02/post';
    await axios_.post(url, formData, {
        headers: {
        ...formData.getHeaders()
    },
    }).then(() => log(chalk.blue(acc + ":"), "posted meme")).catch(() => fs.promises.unlink(path_))
    
    await likePosts(axios_, acc)
    await spin(axios_,acc)
    await getPoints(axios_, acc)
}
const start = async () => {
    const accs = Object.keys(JSON.parse(fs.readFileSync("tokens.json", 'utf-8')))
    while(true) {
        for (const acc of accs) {
            await post(acc).catch(e => console.log(e))
            await sleep(8,15)
        }
    }
}

function sleep(min, max) {
    const minMilliseconds = min * 60 * 1000;
    const maxMilliseconds = max * 60 * 1000;
    const sleepTime = Math.floor(Math.random() * (maxMilliseconds - minMilliseconds + 1)) + minMilliseconds;
    return new Promise(resolve => setTimeout(resolve, sleepTime));
  }
  
start()