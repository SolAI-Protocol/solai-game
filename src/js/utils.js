import { connect } from '../network/websocket'
import { animate } from '../animate'
import { wallet } from '../wallet/multi-wallet'
import { collection, setClothId, setClothUrl, setNFTInfo, setPlayerUrl } from '../user/logIn'
import { myID, users, worker } from '../user/user'

worker.onmessage = function (event) {
  console.log(event.data.id === myID)
  if (event.data) {
    users[event.data.id].setSpriteImages('up', event.data.up)
    users[event.data.id].setSpriteImages('down', event.data.down)
    users[event.data.id].setSpriteImages('left', event.data.left)
    users[event.data.id].setSpriteImages('right', event.data.right)
    users[event.data.id].setSpriteImages('base', event.data.base)
    users[event.data.id].setDirection('down')

    if (event.data.id === myID) {
      document.getElementById('loading').style.display = 'none'
      animate()
    }
  }
}
worker.onerror = function (err) {
  console.log(err)
}

export async function findMyNFT() {
  document.getElementById('chain_containers').style.display = 'none'
  document.getElementById('loading_container').style.display = 'block'
  if (wallet.selectedChain === '' || wallet.getAccountId() === '') return
  // 체인이 니어일 때
  if (wallet.selectedChain === 'near') {
    var nft_contract_list = [
      'asac.web3mon.testnet',
      'nearnauts.web3mon.testnet',
      'nftv1.web3mon.testnet',
      //   'near-punks.near',
      //   'nearnautnft.near',
      //   'asac.near',
      //   'tinkerunion_nft.enleap.near',
      //   'v0.apemetaerror.near',
      //   'cartelgen1.neartopia.near',
      //   'realbirds.near',
      //   'mrbrownproject.near',
    ]
    var args = {
      account_id: wallet.getAccountId(),
      from_index: '0',
      limit: 50,
    }
    // 초기화
    document.querySelector('#nftListBox').innerHTML = ''
    document.getElementById('tokenId').value = ''
    let imgs = []
    let clothes = []

    for (var contract_id of nft_contract_list) {
      var metadata = await wallet.viewMethod({
        contractId: contract_id,
        method: 'nft_metadata',
      })
      var data = await wallet.viewMethod({
        contractId: contract_id,
        method: 'nft_tokens_for_owner',
        args: args,
      })

      if (data.length !== 0) {
        data.forEach((nft) => {
          let img = document.createElement('img')
          if (nft.metadata.media.includes('https://'))
            img.src = nft.metadata.media
          else img.src = metadata.base_uri + '/' + nft.metadata.media

          const name = `${metadata.name} #${nft.metadata.title}`

          img.style = 'width: min(100px, 15%); opacity: 0.5;'
          img.setAttribute('collection', contract_id)
          img.setAttribute('asset_id', nft.token_id)
          img.setAttribute('name', name)
          if (contract_id === 'nftv1.web3mon.testnet') {
            clothes.push(img)
            img.onclick = onClothClick
          } else {
            imgs.push(img)
            img.onclick = onImgClick
          }
        })
      }
    }

    imgs.forEach((i) => {
      document.querySelector('#nftListBox').appendChild(i)
    })

    clothes.forEach((i) => {
      document.querySelector('#clothesBox').appendChild(i)
    })

    if (imgs.length === 0) {
      let p = document.createElement('p')
      p.innerHTML = 'There is no NFT'
      document.querySelector('#nftListBox').appendChild(p)
    }

    if (clothes.length === 0) {
      let p = document.createElement('p')
      p.innerHTML = 'There are no Clothes'
      document.querySelector('#clothesBox').appendChild(p)
    }
  }

  // terra
  if (wallet.seletedChain === 'terra') {
    var nft_contract_list = [
      'terra16ds898j530kn4nnlc7xlj6hcxzqpcxxk4mj8gkcl3vswksu6s3zszs8kp2',
      'terra17vysjt8ws64v8w696mavjpqs8mksf8s993qghlust9yey8qcmppqnhgw0e',
    ]
    document.querySelector('#nftListBox').innerHTML = ''
    document.getElementById('tokenId').value = ''
    var imgs = []
    for (var contract_id of nft_contract_list) {
      var args = {
        owner: wallet.getAccountId(),
      }
      var res = await wallet.viewMethod({
        contractId: contract_id,
        method: 'tokens',
        args: args,
      })

      var key = Object.keys(res.data)[0]
      for (var i in res.data[key]) {
        var nft = res.data[key][i]
        var args = { token_id: nft }
        var nft_data = await wallet.viewMethod({
          contractId: contract_id,
          method: 'nft_info',
          args: args,
        })
        var img = document.createElement('img')
        var img_url = nft_data.data.extension.image
        if (img_url === undefined) {
          var response = await fetch(nft_data.data.token_uri, {
            method: 'GET',
          })
          response = await response.json()
          // console.log(response)
          img_url = response.media
        } else if (!img_url.includes('https://'))
          img_url = `https://ipfs.io/ipfs/${nft_data.data.extension.image.replace(
            'ipfs://',
            ''
          )}`
        img.src = img_url
        img.style = 'width: min(100px, 15%); opacity: 0.5;'
        img.setAttribute('asset_id', nft)
        img.setAttribute('collection', contract_id)
        img.setAttribute('name', nft_data.data.extension.name)
        img.onclick = onImgClick
        imgs.push(img)
      }
    }
    imgs.forEach((i) => {
      document.querySelector('#nftListBox').appendChild(i)
    })
    if (imgs.length === 0) {
      let p = document.createElement('p')
      p.innerHTML = 'There is no NFT'
      document.querySelector('#nftListBox').appendChild(p)
    }
  }

  // 체인이 알고랜드일 때
  if (wallet.seletedChain === 'algo') {
    const base_url =
      'https://broken-spring-moon.algorand-mainnet.discover.quiknode.pro/index/v2/'
    const url = `accounts/${window.accountId}/assets`

    var res = await fetch(base_url + url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    res = await res.json()

    // 초기화
    document.querySelector('#nftListBox').innerHTML = ''
    document.getElementById('tokenId').value = ''
    let imgs = []

    for (var i in res.assets) {
      var nft = res.assets[i]
      if (nft.amount !== 1) continue
      let url = `assets/${nft['asset-id']}`

      var nft_data = await fetch(base_url + url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      nft_data = await nft_data.json()
      if (nft_data.asset.params['unit-name'] === undefined) continue
      if (nft_data.asset.params['unit-name'].startsWith(collection)) {
        let img = document.createElement('img')
        console.log(nft['asset-id'])

        img.src = `https://ipfs.io/ipfs/${nft_data.asset.params.url.replace(
          'ipfs://',
          ''
        )}`
        img.style = 'width: 100px; opacity: 0.5;'
        img.onclick = onImgClick(img, nft['asset-id'], nft['name'])
        imgs.push(img)
      }
    }

    imgs.forEach((i) => {
      document.querySelector('#nftListBox').appendChild(i)
    })
  }
  document.getElementById('loading_container').style.display = 'none'
  document.getElementById('nft_choose_container').style.display = 'flex'
}

let prevSelect = undefined
let prevSelectCloth = undefined

function onImgClick(e) {
  if (prevSelect !== undefined) prevSelect.style.opacity = 0.5
  e.target.style.opacity = 1.0
  prevSelect = e.target
  setPlayerUrl(e.target.src)
  setNFTInfo(
    e.target.getAttribute('collection'),
    e.target.getAttribute('asset_id')
  )
}

function onClothClick(e) {
  if (prevSelectCloth !== undefined) prevSelectCloth.style.opacity = 0.5
  e.target.style.opacity = 1.0
  prevSelectCloth = e.target
  console.log(e.target.getAttribute('asset_id'))
  setClothId(e.target.getAttribute('asset_id'))
}
