/*
MiGTA Karte Generator is licensed under the MIT License
Copyright (c) 2024 himatchi
See also https://github.com/himatchi/MiGTAKarteGenerator/blob/main/LICENSE
*/

let autoReloadTimer;

async function reloadWanted(){
  const loadedData = JSON.parse(localStorage.getItem('MiGTAWantedCheckerRawData'));
  let data = [];
  if (loadedData) {

    // 現在の日時から24時間前の日時をミリ秒で取得
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    // createdAtが24時間以内の要素のみを抽出
    data = loadedData.filter(item => {
        const itemDate = Date.parse(item.createdAt);
        return itemDate > oneDayAgo;
    });
  }
  const newData = await fetchWanted(data, undefined);
  localStorage.setItem('MiGTAWantedCheckerRawData', JSON.stringify([...newData, ...data]));
  const wantedData = refreshWanted(newData, data);
  showWanted(wantedData);
  return;
}

async function fetchWanted(storedData, fetchedData){
  let continueFlag = true;
  const requestBody = {
    userId: "9nffcvpy18lb0fus",
    limit: 100,
  };
  if (storedData && storedData.length > 0){
    requestBody.sinceId = storedData[0].id;
  }
  if (fetchedData){
    requestBody.untilId = fetchedData[fetchedData.length - 1].id;
  }else{
    fetchedData = [];
  }
  const response = await fetch("https://misskey.io/api/users/notes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  // レスポンスをJSON形式で取得
  const newData = await response.json();
  
  if(newData.length < 100){
    continueFlag = false;
  }
  // 現在の日時から24時間前の日時をミリ秒で取得
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  if(newData.length > 0){
    const lastItemDate = Date.parse(newData[newData.length - 1].createdAt)
    if(lastItemDate < oneDayAgo){
      continueFlag = false;
    }
  } else {
    return fetchedData;
  }
  const filteredNewData = newData.filter(item => {
    const itemDate = Date.parse(item.createdAt);
    return itemDate > oneDayAgo;
  });
  const mergedFetchedData = [...fetchedData, ...filteredNewData];
  if(continueFlag){
    return await fetchWanted(storedData, mergedFetchedData);
  } else {
    return mergedFetchedData;
  }
}

function showWanted(wantedData){
  const wantedList = document.getElementById('wantedList');
  wantedList.innerHTML = '';
  if(wantedData && wantedData.length > 0){
    wantedData.forEach((item)=>{
      if(item.isDisplay){
        const option = document.createElement('option');
        const limit = new Date(item.limit).toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        option.text = `～${limit} - ${item.name}`
        if(item.isActive == false){
          option.style="text-decoration: line-through;";
        }
        wantedList.add(option);
      }
    });
  }
  return;
}

function generateWanted(rawData){
  const FilteredRawData = rawData.filter((item)=>{
    return item.text.includes('指名手配情報');
  })
  let newData = [];
  if(FilteredRawData && FilteredRawData.length > 0){
    FilteredRawData.forEach((item=>{
      const nameBlockText = item.text.split('時間：')[0];
      const regex = /「([^」]+)」|- ([^「」\n]+)/gm;
      let match;
      const names = [];
      
      while ((match = regex.exec(nameBlockText)) !== null) {
        const name = match[1] || match[2];
        names.push(name);
      }

      const id = item.id;
      const createAt = new Date(item.createdAt);
      const rawText = removeFirstAndLastFour(item.text);
      const limitMatch = item.text.match(/時間：~ (\d\d\/\d\d \d\d:\d\d)/);
      const limit = limitMatch ? parseFutureDate(limitMatch[1]) : null;
      const isActive = true;
      const isDisplay = true;

      names.forEach((name)=>{
        newData.push({
          id, createAt, rawText, name, limit, isActive, isDisplay
        });
      });
    }));
  }
  return newData;
}

function refreshWanted(newRawData, oldRawData){
  const loadedData = JSON.parse(localStorage.getItem('MiGTAWantedCheckerData'));
  let data = [];
  if(loadedData){
    // 現在の日時日時をミリ秒で取得
    const nowTime = Date.now();
  
    // limitが超過している要素を削除
    data = loadedData.filter(item => {
        const itemDate = Date.parse(item.limit);
        return itemDate > nowTime;
    });
  }

  //古いデータから不慮に消えてるものがあったら復旧する
  const oldData = generateWanted(oldRawData);

  //復旧したデータのうち、表にIDが存在しないものを追加
  oldData.forEach((item)=>{
    if(data && data.some(search=> search.id === item.id) == false){
      data.push(item);
    }
  });

  //新しいデータを追加する
  const newData = generateWanted(newRawData);
  data = [...newData, ...data];

  //limitでソート。ただしisDisplayがfalseの場合、末尾へ
  data.sort((a, b) => {
    // isDisplayedがfalseの場合は末尾へ
    if (a.isDisplay !== b.isDisplay) {
      return a.isDisplay ? -1 : 1;
    }
    // isDisplayedが同じ場合はlimitで降順ソート
    return Date.parse(b.limit) - Date.parse(a.limit)
  });

  //重複している名前があれば、より新しいもののみ残して削除
  data = removeDuplicatesByProperty(data, 'name');

  localStorage.setItem('MiGTAWantedCheckerData', JSON.stringify(data));
  return data;
}

function parseFutureDate(timeString) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const dateParts = timeString.split(' '); // "MM/DD" と "HH:MM" に分割
  const date = dateParts[0]; // "MM/DD"
  const time = dateParts[1]; // "HH:MM"
  
  // 現在の年と与えられた日時文字列からDateオブジェクトを作成
  let futureDate = new Date(`${currentYear}/${date} ${time}`);

  // 作成した日時が現在時刻より過去であれば、1年加えて未来の日時に修正
  if (futureDate <= now) {
      futureDate.setFullYear(currentYear + 1);
  }

  return futureDate;
}

function switchEnableWanted(){
  const loadedData = JSON.parse(localStorage.getItem('MiGTAWantedCheckerData'));
  const wantedList = document.getElementById('wantedList');
  const selectedIndex = wantedList.selectedIndex;
  loadedData[selectedIndex].isActive = !loadedData[selectedIndex].isActive;
  localStorage.setItem('MiGTAWantedCheckerData', JSON.stringify(loadedData));
  showWanted(loadedData);
  wantedList.selectedIndex = selectedIndex;
}

function deleteWanted(){
  const loadedData = JSON.parse(localStorage.getItem('MiGTAWantedCheckerData'));
  const wantedList = document.getElementById('wantedList');
  const selectedIndex = wantedList.selectedIndex;
  loadedData[selectedIndex].isDisplay = false;
  localStorage.setItem('MiGTAWantedCheckerData', JSON.stringify(loadedData));
  showWanted(loadedData);
}

function forceReloadWanted(){
  localStorage.removeItem('MiGTAWantedCheckerRawData');
  localStorage.removeItem('MiGTAWantedCheckerData');
  reloadWanted();
}

function selecedWantedChanged(){
  const loadedData = JSON.parse(localStorage.getItem('MiGTAWantedCheckerData'));
  const wantedList = document.getElementById('wantedList');
  const selectedIndex = wantedList.selectedIndex;
  const wantedTime = document.getElementById('wantedTime');
  const wantedName = document.getElementById('wantedName');
  const wantedDescription = document.getElementById('wantedDescription');
  const wanted = loadedData[selectedIndex];
  wantedTime.value = formatDateToDatetimeLocal(new Date(wanted.limit));
  wantedName.value = wanted.name;
  wantedDescription.value = wanted.rawText;
}

function formatDateToDatetimeLocal(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月は0から始まるため、1を足す
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function addWanted(){
  const loadedData = JSON.parse(localStorage.getItem('MiGTAWantedCheckerData'));
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const createAt = new Date(Date.now());
  const rawText = document.getElementById('wantedDescription').value;
  const name = document.getElementById('wantedName').value;
  const limit = new Date(document.getElementById('wantedTime').value);
  const isActive = true;
  const isDisplay = true;
  loadedData.push({
    id, createAt, rawText, name, limit, isActive, isDisplay
  });
  //limitでソート
  loadedData.sort((a, b) => Date.parse(b.limit) - Date.parse(a.limit));
  localStorage.setItem('MiGTAWantedCheckerData', JSON.stringify(loadedData));
  showWanted(loadedData);
}

function clearWanted(){
  document.getElementById('wantedDescription').value = "";
  document.getElementById('wantedName').value = "";
  document.getElementById('wantedTime').value = "";
  document.getElementById('wantedList').selectedIndex = -1;
}

function overwriteWanted(){
  const loadedData = JSON.parse(localStorage.getItem('MiGTAWantedCheckerData'));
  const wantedList = document.getElementById('wantedList');
  const selectedIndex = wantedList.selectedIndex;
  loadedData[selectedIndex].rawText = document.getElementById('wantedDescription').value;
  loadedData[selectedIndex].name = document.getElementById('wantedName').value;
  loadedData[selectedIndex].limit = new Date(document.getElementById('wantedTime').value);
  localStorage.setItem('MiGTAWantedCheckerData', JSON.stringify(loadedData));
  showWanted(loadedData);
}

function switchAutoReloadWanted(){
  const isAutoReloadWanted = document.getElementById('autoReloadWanted').checked;
  if (isAutoReloadWanted){
    autoReloadTimer = setInterval(reloadWanted, 300000)
  } else {
    clearInterval(autoReloadTimer);
  }
  saveSettings();
}

function removeFirstAndLastFour(str) {
  // 文字列が14文字未満の場合は、先頭と末尾の文字を削除できないため空文字列を返す
  if (str.length < 14) {
      return "";
  }
  // 先頭10文字をスキップし、末尾4文字手前までの部分文字列を取り出す
  return str.slice(10, -4);
}
function removeDuplicatesByProperty(array, propName) {
  const unique = new Map();

  array.forEach(obj => {
    const normalizedKey = normalizeString(obj[propName]);
    if (!unique.has(normalizedKey)) {
        unique.set(normalizedKey, obj);
    }
  });

  // `Map.prototype.values()` で Map の値のみを取得し、配列に変換
  return Array.from(unique.values());
}

function normalizeString(str) {
    // 全角数字を半角に変換
    const fullWidthToHalfWidth = str.replace(/[０-９]/g, char => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
  });

  // 小文字に変換し、すべての種類のスペースを削除
  return fullWidthToHalfWidth.toLowerCase().replace(/[\s　]+/g, '');
}

function switchDisplayWantedChecker(){
  const wantedFinderTd = document.getElementById('wantedFinderTd');
  const isWantedFinderDisplayed = wantedFinderTd.hidden;
  wantedFinderTd.hidden = !isWantedFinderDisplayed;
  saveSettings();
}

function saveSettings(){
  const isAutoReloadWanted = document.getElementById('autoReloadWanted').checked;
  const isWantedFinderHidden= document.getElementById('wantedFinderTd').hidden;
  const settings = {isAutoReloadWanted, isWantedFinderHidden};
  localStorage.setItem('MiGTAWantedCheckerSettings', JSON.stringify(settings));
}

function loadSettings(){
  const settings = JSON.parse(localStorage.getItem('MiGTAWantedCheckerSettings'));
  if (settings){
    document.getElementById('autoReloadWanted').checked = settings.isAutoReloadWanted ? settings.isAutoReloadWanted : false;
    document.getElementById('wantedFinderTd').hidden = settings.isWantedFinderHidden ? settings.isWantedFinderHidden : false;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  //現在のデータを読み込み
  const loadedData = JSON.parse(localStorage.getItem('MiGTAWantedCheckerData'));
  showWanted(loadedData);
  loadSettings();
  //初期化
  clearWanted();
  switchAutoReloadWanted();
});