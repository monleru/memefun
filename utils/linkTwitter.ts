import { randomUUID } from 'crypto'
import { gotScraping } from 'got-scraping'
import axios from 'axios'
import fs from 'fs'

const log = console.log;

export const shuffle = <T>(array: T[]): T[] => (array && array.length > 0 ? array.sort(() => (Math.random() > 0.5 ? 1 : -1)) : array)
export const choice = <T>(array: T[]): T => shuffle(array)[0] as T
const checkers = ['https://api.ipify.org?format=json', 'https://ifconfig.me/all.json']

export const getIp = async (proxy:string) =>
    gotScraping
      .get(choice(checkers), { proxyUrl: proxy })
      .json()
      .then((response: any) => response.ip || response.ip_addr)
      .catch(() => (false))
  

interface Response {
    token: string
    refresh_token: string
}

export const linkTwitter = async (auth_token, proxyUrl): Promise<Response> => {
    if(!(await getIp(proxyUrl))) {
        throw new Error("proxy")
    }
    console.log(223)
    const data = await gotScraping.post("https://auth.privy.io/api/v1/oauth/init",{
        json: {
            "provider": "twitter",
            "redirect_to": "https://meme.fun/login" 
        },
          headers: {
            Origin: "https://meme.fun",
            "privy-app-id": "clnjqpsk003stlc0fczrtpy4v",
            // "privy-ca-id": "e507cb6e-d8c4-4182-ad8a-de405114d23a"
          },
          proxyUrl
    }).json()
    const url_ = new URL(data.url);
    const params = new URLSearchParams(url_.search);

    const state = (params.get('state'))

    const twitter = {
      csrf: randomUUID().replace(/-/g, ''),
      token: auth_token
    }

    const twitterClient = gotScraping.extend({
      headers: {
        accept: '*/*',
        'accept-language': 'ru-RU,ru;q=0.8',
        authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'x-csrf-token': twitter.csrf,
        'x-twitter-active-user': 'yes',
        'x-twitter-auth-type': 'OAuth2Session',
        'x-twitter-client-language': 'en',
        cookie: `lang=en; guest_id=v1%3A169866788108797790; auth_token=${twitter.token}; ct0=${twitter.csrf}; dnt=1;`,
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
      proxyUrl
    })

    const { auth_code } = await twitterClient
      .get(`https://twitter.com/i/api/2/oauth2/authorize?${data.url.split("?")[1]}`)
      .json()
      .then((r: any) => r)
      .catch((e: any) => log(e.statusCode))

    if (!auth_code) {
        throw new Error("twitter")
    }


    const meme = await twitterClient.post('https://twitter.com/i/api/2/oauth2/authorize', {
      form: {
        approval: true,
        code: auth_code
      }
    }).json().then(data => (data))

    const url__ = (await gotScraping(meme.redirect_uri)).redirectUrls[0]
    const params_ = (url__.searchParams);
    const response:Response = await gotScraping.post("https://auth.privy.io/api/v1/oauth/authenticate",{
        json: {
            "authorization_code": params_.get("privy_oauth_code"),
            "state_code": params_.get("privy_oauth_state")
        },
        headers: {
            Origin: "https://meme.fun",
            "privy-app-id": "clnjqpsk003stlc0fczrtpy4v",
            "privy-ca-id": "e507cb6e-d8c4-4182-ad8a-de405114d23a"
        },
        proxyUrl
    }).json().then(r => r as Response)

    return response
    gotScraping('https://api.meme.fun/user')
    // https://api.meme.fun/user/blast-address PUT {"address":"0xc25592b7563E2605C60164AE9Ca18F3AaA88E2A0"}

  }


  const start = async () => {
    const twitters = (await fs.promises.readFile("./twitter.txt",'utf-8')).split('\n').map((i) => i.trim()).filter((i) => i.length > 0)
    const proxies = (await fs.promises.readFile("./proxy.txt",'utf-8')).split('\n').map((i) => i.trim()).filter((i) => i.length > 0)

    let i = 0
    let p = 0
    while(true) {
        try{
            const{ token, refresh_token} = await linkTwitter(twitters[i],"hg80tm3yxf:6xil01b8to_streaming-1@premium2.travchisproxies.com:12321")
            console.log(token)
        } catch(e) {
            if(e.message === "proxy") {
                console.log("proxy")
                console.log(proxies[p])
                console.log(proxies.splice(p,1))
                await fs.promises.writeFile('./proxy.txt', proxies.join('\n'))
                continue    
            } else if (e.message == "twitter") {
                console.log("twitter")
                twitters.splice(i,1)
                await fs.promises.writeFile('./twitter.txt', twitters.join('\n'))
                continue
            } else {
                console.log(e)
                break
            }
        }
        if(i + 1 > twitters.length) break
        if(p + 1 > proxies.length) break
        i++
        p++
    }  
}
//   linkTwitter("b58055eafe87b99c436b74e3610a6740b4cd9105","http://hg80tm3yxf:6xil01b8to_session-QzOwz99d_streaming-1@premium2.travchisproxies.com:12321").then(data => console.log(data.refresh_token, data.token))


start()