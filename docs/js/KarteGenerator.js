/*
MiGTA Karte Generator is licensed under the MIT License
Copyright (c) 2024 himatchi
See also https://github.com/himatchi/MiGTAKarteGenerator/blob/main/LICENSE
*/

var presets = [];
var customDarkColor = {
  isActive: false,
  color: {
    text: '#cccccc',
    bg: '#202020',
    bt: '#424242',
    btD: '#888888',
    border: '#666666',
    accent: '#d69739'
  }
};
var beforeKarte = {};
var tempKarte = {};
var isLoaded = false;

function nameUpdateSelectOptions() {
  const searchBox = document.getElementById('nameSearchBox');
  const resultSelect = document.getElementById('nameResultSelect');
  const dataSource = document.getElementById('nameDataSource');
  const lines = dataSource.value.split('\n');
  resultSelect.innerHTML = ''; // select要素をクリア
  lines.forEach(function(line) {
    if (line.includes(searchBox.value)) {
    const option = document.createElement('option');
    option.text = line.trim().split(';')[0]; // トリムしてからセミコロン前を追加
    resultSelect.add(option);
    }
  });
}

function locationUpdateSelectOptions() {
    const searchBox = document.getElementById('locationSearchBox');
    const resultSelect = document.getElementById('locationResultSelect');
    const dataSource = document.getElementById('locationDataSource');
    const lines = dataSource.value.split('\n');
    resultSelect.innerHTML = ''; // select要素をクリア
    lines.forEach(function(line) {
    if (line.includes(searchBox.value)) {
      const option = document.createElement('option');
      option.text = line.trim().split(';')[0]; // トリムしてからセミコロン前を追加
      resultSelect.add(option);
    }
  });
}

function billingUpdateSelectOptions() {
  const isDowned = document.getElementById('symptomE').checked;
  const billing = document.getElementById('billing');

  billing.innerHTML = ''; // select要素をクリア

  if(isDowned){
    billing.innerHTML = `
    <option value="院内蘇生">院内蘇生</option>
    <option value="現場蘇生">現場蘇生</option>
    <option value="事件対応蘇生">事件対応蘇生</option>
    <option value="院内蘇生(初心者割)">院内蘇生(初心者割)</option>
    <option value="現場蘇生(初心者割)">現場蘇生(初心者割)</option>
    <option value="ゆがみ対応">ゆがみ対応</option>
    <option value="C対応・その他補填">C対応・その他補填</option>`
  } else {
    billing.innerHTML = `
    <option value="院内治療">院内治療</option>
    <option value="現場治療">現場治療</option>
    <option value="院内治療(初心者割)">院内治療(初心者割)</option>
    <option value="現場治療(初心者割)">現場治療(初心者割)</option>
    <option value="ゆがみ対応">ゆがみ対応</option>
    <option value="C対応・その他補填">C対応・その他補填</option>`
  }
}

function toggleShowNameDataSource() {
  const targetDiv = document.getElementById('nameDataSourceDiv');
  const nameDataSource = document.getElementById('nameDataSource');
  if (targetDiv.hidden == true){
    targetDiv.hidden = false;
    const len = nameDataSource.value.length;
    nameDataSource.focus();
    nameDataSource.setSelectionRange(len,len);
  } else {
    targetDiv.hidden = true;
  }
}


function toggleShowLocationDataSource() {
  const targetDiv = document.getElementById('locationDataSourceDiv');
  const locationDataSource = document.getElementById('locationDataSource');
  if (targetDiv.hidden == true){
    targetDiv.hidden = false;
    const len = locationDataSource.value.length;
    locationDataSource.focus();
    locationDataSource.setSelectionRange(len,len);
  } else {
    targetDiv.hidden = true;
  }
}

function toggleMultipleNameSelect() {
  const checkBox = document.getElementById('multipleNameSelectEnable').checked;
  const targetButton = document.getElementById('multipleNameSelectButton');
  const targetResult = document.getElementById('multipleNameSelectResult');
  if (checkBox == true){
    targetButton.style="visibility: visible;"
    targetResult.style="visibility: visible;"
  } else {
    targetButton.style="visibility: collapse;"
    targetResult.style="visibility: collapse;"
  }
}

function toggleDisableNameSearchDescription() {
  const checkBox = document.getElementById('disableNameSearch').checked;
  const targetSpan = document.getElementById('disableNameSearchDescription');
  if (checkBox == true){
    targetSpan.hidden = false;
  } else {
    targetSpan.hidden = true;
  }
}

function toggleDisableLocationSearchDescription() {
  const checkBox = document.getElementById('disableLocationSearch').checked;
  const targetSpan = document.getElementById('disableLocationSearchDescription');
  if (checkBox == true){
    targetSpan.hidden = false;
  } else {
    targetSpan.hidden = true;
  }
}

function setDateTime(){

  const currentDate = new Date();
  const dateString = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')} ${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;

  document.getElementById('dateTime').value = dateString;

}

function removeMultipleName() {
  // 右のセレクト要素を取得
  let rightSelect = document.getElementById("multipleNameSelect");

  // 右のセレクト要素で選択されているオプションを取得
  let selectedOptions = rightSelect.selectedOptions;

  // 選択されている各オプションを削除
  for (let i = selectedOptions.length - 1; i >= 0; i--) {
    let option = selectedOptions[i];
    rightSelect.removeChild(option);
  }
}

function patientNames() {
  const isDisableNameSearch = document.getElementById('disableNameSearch').checked;
  const isMultipleNameSelectEnable = document.getElementById('multipleNameSelectEnable').checked;
  let name = "";
  if (isMultipleNameSelectEnable) {
    const multipleNameSelect = document.getElementById("multipleNameSelect");
    let values = [];
    // 右のセレクト要素内の全てのオプションをループ処理
    for (let i = 0; i < multipleNameSelect.options.length; i++) {
      let option = multipleNameSelect.options[i];
      // オプションのvalueを配列に追加
      values.push(option.value);
    }
    name = values.join("　様\nName：");
  } else {
    const name_search_word = document.getElementById('nameSearchBox').value;
    const name_search_result = document.getElementById('nameResultSelect').value;
    if (isDisableNameSearch) {
      name = name_search_word.replace(/[;；]\s?/g,"　様\nName：");
    } else {
      name = name_search_result.trim();
    }
  }
  
  return `${name}　様`;
}

// 文書を生成する関数
function generateText() {
  const dateTime = document.getElementById('dateTime').value;
  const currentDate = new Date();
  const dateString = dateTime != "" ? dateTime : `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')} ${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;

  const name = patientNames();

  const isDisableLocationSearch = document.getElementById('disableLocationSearch').checked;
  let location = "";
  const location_kana = document.getElementById('locationResultSelect').value;
  const location_search_word = document.getElementById('locationSearchBox').value;
  if (isDisableLocationSearch) {
    location = location_search_word;
  } else {
    location = location_kana.trim();
  }

  let cureLocation = "";
  const cureLocationSamePlace = document.getElementById('cureLocationSamePlace').checked;
  const cureLocationMainHospital = document.getElementById('cureLocationMainHospital').checked;
  const cureLocationNorthHospital = document.getElementById('cureLocationNorthHospital').checked;
  const cureLocationUserInput = document.getElementById('cureLocationUserInput').checked;
  const cureLocationMainJail = document.getElementById('cureLocationMainJail').checked;
  const cureLocationSouthJail = document.getElementById('cureLocationSouthJail').checked;
  const cureLocationEastJail = document.getElementById('cureLocationEastJail').checked;
  const cureLocationNorthJail = document.getElementById('cureLocationNorthJail').checked;
  const cureLocationDesertJail = document.getElementById('cureLocationDesertJail').checked;
  const cureLocationText = document.getElementById('cureLocationText').value;

  if (cureLocationSamePlace == true){
    cureLocation = location;
  } else if (cureLocationMainHospital == true){
    cureLocation = "本病院";
  } else if (cureLocationNorthHospital == true){
    cureLocation = "北病院";
  } else if (cureLocationMainJail == true){
    cureLocation = "7275 本署地下留置所";
  } else if (cureLocationSouthJail == true){
    cureLocation = "9148 南署留置所";
  } else if (cureLocationEastJail == true){
    cureLocation = "8047 東署地下留置所";
  } else if (cureLocationNorthJail == true){
    cureLocation = "1038 北署地下留置所";
  } else if (cureLocationDesertJail == true){
    cureLocation = "3004 砂漠署留置所";
  } else if (cureLocationUserInput == true){
    cureLocation = cureLocationText;
  }

  //不明にチェックが入っていたら不明と出力
  const unknownLocation = document.getElementById('unknownLocation').checked;
  location = unknownLocation ? "不明" : location;

  const symptoms = document.querySelectorAll('input[name="symptom"]:checked');
  const doctor = document.getElementById('doctor').value;
  const billing = document.getElementById('billing').value;
  const remarks = document.getElementById('remarks').value;
  const feedback = document.getElementById('feedback').value;
  const isSymptomA = document.getElementById('symptomA').checked; //打撲
  const isSymptomB = document.getElementById('symptomB').checked; //出血
  const isSymptomC = document.getElementById('symptomC').checked; //銃創
  const isSymptomD = document.getElementById('symptomD').checked; //火傷
  const isSymptomE = document.getElementById('symptomE').checked; //気絶

  const isTransportA = document.getElementById('transportA').checked; //本病院
  const isTransportB = document.getElementById('transportB').checked; //北病院
  const isTransportC = document.getElementById('transportC').checked; //砂漠病院

  let symptomsText = Array.from(symptoms).map(symptom => symptom.value).join('・');
  let actionText = "";

  if (isTransportA) actionText = actionText + "本病院に搬送し、";
  if (isTransportB) actionText = actionText + "北病院に搬送し、";
  if (isTransportC) actionText = actionText + "砂漠病院に搬送し、";

  if (isSymptomA) actionText = actionText + "アイスパックで患部を冷やし、";
  if (isSymptomB) actionText = actionText + "縫合キットで患部を縫合し、";
  if (isSymptomC) actionText = actionText + "ピンセットで弾丸を摘出し、";
  if (isSymptomD) actionText = actionText + "火傷クリームを患部に塗布し、";
  if (isSymptomE){
    actionText = actionText + "除細動器による蘇生を実施";
  } else {
    actionText = actionText + "医療キットによる治療を実施";
  }
  let generatedText = '';
  generatedText = `Date：${dateString}\nName：${name}\n怪我の場所：${location}\n治療の場所：${cureLocation}\n症状：${symptomsText}\n治療者：${doctor}\n対処：${actionText}\n請求：${billing}\n備考：${remarks}`;

  const isDisableFeedback = document.getElementById('disableFeedback').checked;
  
  if (isDisableFeedback == false){
    generatedText = generatedText + `\n感想「${feedback}」`;
  }

  const isAddTitleCol = document.getElementById('addTitleCol').checked;
  const isMultipleNameSelectEnable = document.getElementById('multipleNameSelectEnable').checked;

  if (isAddTitleCol == true && isMultipleNameSelectEnable == true){
    let allName = name.split('\nName：').join(' / ');
    generatedText = generatedText + `\n${allName}`;
  }

  document.getElementById('outputText').value = generatedText;
  document.getElementById('nameDataSourceDiv').hidden = true;
  document.getElementById('locationDataSourceDiv').hidden = true;
  if (document.getElementById('enableClipboard').checked) {
    copyTextToClipboard(generatedText);
  }

}

function clearInput() {
  beforeKarte.dateTime = document.getElementById('dateTime').value;
  beforeKarte.nameSearchBox = document.getElementById('nameSearchBox').value;
  beforeKarte.locationSearchBox = document.getElementById('locationSearchBox').value;
  beforeKarte.billing = document.getElementById('billing').value;
  beforeKarte.remarks = document.getElementById('remarks').value;
  beforeKarte.feedback = document.getElementById('feedback').value;
  beforeKarte.symptomA = document.getElementById('symptomA').checked; //打撲
  beforeKarte.symptomB = document.getElementById('symptomB').checked; //出血
  beforeKarte.symptomC = document.getElementById('symptomC').checked; //銃創
  beforeKarte.symptomD = document.getElementById('symptomD').checked; //火傷
  beforeKarte.symptomE = document.getElementById('symptomE').checked; //気絶
  beforeKarte.transportA = document.getElementById('transportA').checked; //本病院
  beforeKarte.transportB = document.getElementById('transportB').checked; //北病院
  beforeKarte.transportC = document.getElementById('transportC').checked; //砂漠病院
  beforeKarte.disableFeedback = document.getElementById('disableNameSearch').checked;
  beforeKarte.multipleNameSelectEnable = document.getElementById('multipleNameSelectEnable').checked;
  beforeKarte.disableLocationSearch = document.getElementById('disableLocationSearch').checked;
  beforeKarte.outputText = document.getElementById('outputText').value;
  beforeKarte.multipleNameSelect = document.getElementById('multipleNameSelect').innerHTML;
  beforeKarte.nameDataSourceDiv = document.getElementById('nameDataSourceDiv').hidden;
  beforeKarte.locationDataSourceDiv = document.getElementById('locationDataSourceDiv').hidden;
  beforeKarte.clipboardResult = document.getElementById('clipboardResult').innerText;
  beforeKarte.disableNameSearchDescription = document.getElementById('disableNameSearchDescription').hidden;
  beforeKarte.disableLocationSearchDescription = document.getElementById('disableLocationSearchDescription').hidden;
  beforeKarte.unknownLocation = document.getElementById('unknownLocation').checked;
  beforeKarte.cureLocationSamePlace = document.getElementById('cureLocationSamePlace').checked;
  beforeKarte.cureLocationMainHospital = document.getElementById('cureLocationMainHospital').checked;
  beforeKarte.cureLocationNorthHospital = document.getElementById('cureLocationNorthHospital').checked;
  beforeKarte.cureLocationUserInput = document.getElementById('cureLocationUserInput').checked;
  beforeKarte.cureLocationMainJail = document.getElementById('cureLocationMainJail').checked;
  beforeKarte.cureLocationSouthJail = document.getElementById('cureLocationSouthJail').checked;
  beforeKarte.cureLocationEastJail = document.getElementById('cureLocationEastJail').checked;
  beforeKarte.cureLocationNorthJail = document.getElementById('cureLocationNorthJail').checked;
  beforeKarte.cureLocationDesertJail = document.getElementById('cureLocationDesertJail').checked;
  beforeKarte.cureLocationText = document.getElementById('cureLocationText').value;
  beforeKarte.presetName = document.getElementById('presetName').value;
  beforeKarte.nameResultSelect = document.getElementById('nameResultSelect').selectedIndex;
  beforeKarte.multipleNameSelect = document.getElementById('multipleNameSelect').selectedIndex;
  beforeKarte.locationResultSelect = document.getElementById('locationResultSelect').selectedIndex;
  beforeKarte.presetSelect = document.getElementById('presetSelect').selectedIndex;

  document.getElementById('dateTime').value = "";
  document.getElementById('nameSearchBox').value = "";
  document.getElementById('locationSearchBox').value = "";
  document.getElementById('billing').value = "院内治療";
  document.getElementById('remarks').value = "";
  document.getElementById('feedback').value = "";
  document.getElementById('symptomA').checked = false; //打撲
  document.getElementById('symptomB').checked = false; //出血
  document.getElementById('symptomC').checked = false; //銃創
  document.getElementById('symptomD').checked = false; //火傷
  document.getElementById('symptomE').checked = false; //気絶
  document.getElementById('transportA').checked = false; //本病院
  document.getElementById('transportB').checked = false; //北病院
  document.getElementById('transportC').checked = false; //砂漠病院
  document.getElementById('disableNameSearch').checked = false;
  document.getElementById('multipleNameSelectEnable').checked = false;
  document.getElementById('disableLocationSearch').checked = false;
  document.getElementById('outputText').value = "";
  document.getElementById('multipleNameSelect').innerHTML = "";
  document.getElementById('nameDataSourceDiv').hidden = true;
  document.getElementById('locationDataSourceDiv').hidden = true;
  document.getElementById('clipboardResult').innerText = "";
  document.getElementById('disableNameSearchDescription').hidden = true;
  document.getElementById('disableLocationSearchDescription').hidden = true;
  document.getElementById('unknownLocation').checked= false;
  document.getElementById('cureLocationMainHospital').checked = true;
  document.getElementById('cureLocationText').value = "";
  document.getElementById('presetName').value = "";
  if (isLoaded == true){
    document.getElementById('karteClearUndoButton').disabled = false;
  }
  toggleMultipleNameSelect();
  toggleShowFeedback();
  nameUpdateSelectOptions();
  locationUpdateSelectOptions();
  billingUpdateSelectOptions();
  presetUpdateSelectOptions();
}

function clearUndo(){
  tempKarte.dateTime = document.getElementById('dateTime').value;
  tempKarte.nameSearchBox = document.getElementById('nameSearchBox').value;
  tempKarte.locationSearchBox = document.getElementById('locationSearchBox').value;
  tempKarte.remarks = document.getElementById('remarks').value;
  tempKarte.feedback = document.getElementById('feedback').value;
  tempKarte.symptomA = document.getElementById('symptomA').checked; //打撲
  tempKarte.symptomB = document.getElementById('symptomB').checked; //出血
  tempKarte.symptomC = document.getElementById('symptomC').checked; //銃創
  tempKarte.symptomD = document.getElementById('symptomD').checked; //火傷
  tempKarte.symptomE = document.getElementById('symptomE').checked; //気絶
  tempKarte.transportA = document.getElementById('transportA').checked; //本病院
  tempKarte.transportB = document.getElementById('transportB').checked; //北病院
  tempKarte.transportC = document.getElementById('transportC').checked; //砂漠病院
  tempKarte.disableFeedback = document.getElementById('disableNameSearch').checked;
  tempKarte.multipleNameSelectEnable = document.getElementById('multipleNameSelectEnable').checked;
  tempKarte.disableLocationSearch = document.getElementById('disableLocationSearch').checked;
  tempKarte.outputText = document.getElementById('outputText').value;
  tempKarte.multipleNameSelect = document.getElementById('multipleNameSelect').innerHTML;
  tempKarte.nameDataSourceDiv = document.getElementById('nameDataSourceDiv').hidden;
  tempKarte.locationDataSourceDiv = document.getElementById('locationDataSourceDiv').hidden;
  tempKarte.clipboardResult = document.getElementById('clipboardResult').innerText;
  tempKarte.disableNameSearchDescription = document.getElementById('disableNameSearchDescription').hidden;
  tempKarte.disableLocationSearchDescription = document.getElementById('disableLocationSearchDescription').hidden;
  tempKarte.unknownLocation = document.getElementById('unknownLocation').checked;
  tempKarte.cureLocationSamePlace = document.getElementById('cureLocationSamePlace').checked;
  tempKarte.cureLocationMainHospital = document.getElementById('cureLocationMainHospital').checked;
  tempKarte.cureLocationNorthHospital = document.getElementById('cureLocationNorthHospital').checked;
  tempKarte.cureLocationUserInput = document.getElementById('cureLocationUserInput').checked;
  tempKarte.cureLocationMainJail = document.getElementById('cureLocationMainJail').checked;
  tempKarte.cureLocationSouthJail = document.getElementById('cureLocationSouthJail').checked;
  tempKarte.cureLocationEastJail = document.getElementById('cureLocationEastJail').checked;
  tempKarte.cureLocationNorthJail = document.getElementById('cureLocationNorthJail').checked;
  tempKarte.cureLocationDesertJail = document.getElementById('cureLocationDesertJail').checked;
  tempKarte.cureLocationText = document.getElementById('cureLocationText').value;
  tempKarte.presetName = document.getElementById('presetName').value;
  tempKarte.billing = document.getElementById('billing').value;
  tempKarte.nameResultSelect = document.getElementById('nameResultSelect').selectedIndex;
  tempKarte.multipleNameSelect = document.getElementById('multipleNameSelect').selectedIndex;
  tempKarte.locationResultSelect = document.getElementById('locationResultSelect').selectedIndex;
  tempKarte.presetSelect = document.getElementById('presetSelect').selectedIndex;

  document.getElementById('dateTime').value = beforeKarte.dateTime;
  document.getElementById('nameSearchBox').value = beforeKarte.nameSearchBox;
  document.getElementById('locationSearchBox').value = beforeKarte.locationSearchBox;
  document.getElementById('remarks').value = beforeKarte.remarks;
  document.getElementById('feedback').value = beforeKarte.feedback;
  document.getElementById('symptomA').checked = beforeKarte.symptomA; //打撲
  document.getElementById('symptomB').checked = beforeKarte.symptomB; //出血
  document.getElementById('symptomC').checked = beforeKarte.symptomC; //銃創
  document.getElementById('symptomD').checked = beforeKarte.symptomD; //火傷
  document.getElementById('symptomE').checked = beforeKarte.symptomE; //気絶
  document.getElementById('transportA').checked = beforeKarte.transportA; //本病院
  document.getElementById('transportB').checked = beforeKarte.transportB; //北病院
  document.getElementById('transportC').checked = beforeKarte.transportC; //砂漠病院
  document.getElementById('disableNameSearch').checked = beforeKarte.disableFeedback;
  document.getElementById('multipleNameSelectEnable').checked = beforeKarte.multipleNameSelectEnable;
  document.getElementById('disableLocationSearch').checked = beforeKarte.disableLocationSearch ;
  document.getElementById('outputText').value = beforeKarte.outputText;
  document.getElementById('multipleNameSelect').innerHTML = beforeKarte.multipleNameSelect;
  document.getElementById('nameDataSourceDiv').hidden = beforeKarte.nameDataSourceDiv;
  document.getElementById('locationDataSourceDiv').hidden = beforeKarte.locationDataSourceDiv;
  document.getElementById('clipboardResult').innerText = beforeKarte.clipboardResult;
  document.getElementById('disableNameSearchDescription').hidden = beforeKarte.disableNameSearchDescription;
  document.getElementById('disableLocationSearchDescription').hidden = beforeKarte.disableLocationSearchDescription;
  document.getElementById('unknownLocation').checked = beforeKarte.unknownLocation;
  document.getElementById('cureLocationSamePlace').checked = beforeKarte.cureLocationSamePlace;
  document.getElementById('cureLocationMainHospital').checked = beforeKarte.cureLocationMainHospital;
  document.getElementById('cureLocationNorthHospital').checked = beforeKarte.cureLocationNorthHospital;
  document.getElementById('cureLocationUserInput').checked = beforeKarte.cureLocationUserInput;
  document.getElementById('cureLocationMainJail').checked = beforeKarte.cureLocationMainJail;
  document.getElementById('cureLocationSouthJail').checked = beforeKarte.cureLocationSouthJail;
  document.getElementById('cureLocationEastJail').checked = beforeKarte.cureLocationEastJail;
  document.getElementById('cureLocationNorthJail').checked = beforeKarte.cureLocationNorthJail;
  document.getElementById('cureLocationDesertJail').checked = beforeKarte.cureLocationDesertJail;
  document.getElementById('cureLocationText').value = beforeKarte.cureLocationText;
  document.getElementById('presetName').value = beforeKarte.presetName;

  toggleMultipleNameSelect();
  toggleShowFeedback();
  nameUpdateSelectOptions();
  locationUpdateSelectOptions();
  billingUpdateSelectOptions();
  document.getElementById('billing').value = beforeKarte.billing;
  document.getElementById('nameResultSelect').selectedIndex = beforeKarte.nameResultSelect;
  document.getElementById('multipleNameSelect').selectedIndex = beforeKarte.multipleNameSelect;
  document.getElementById('locationResultSelect').selectedIndex = beforeKarte.locationResultSelect;
  document.getElementById('presetSelect').selectedIndex = beforeKarte.presetSelect;

  beforeKarte = {...tempKarte};
}

function saveData() {
  const doctor = document.getElementById('doctor').value;
  const nameDataSource = document.getElementById('nameDataSource').value;
  const locationDataSource = document.getElementById('locationDataSource').value;
  const enableClipboard = document.getElementById('enableClipboard').checked;
  const autoPresetApply = document.getElementById('autoPresetApply').checked;
  const isAddTitleCol = document.getElementById('addTitleCol').checked;
  const isDisableFeedback = document.getElementById('disableFeedback').checked;
  const presetShowSize = document.getElementById('presetSelect').size;
  const isPresetAutoCollapse = document.getElementById('presetAutoCollapse').checked;
  const isForceLightDarkChange = document.getElementById('forceLightDarkChange').checked;
  const isHiddenMemoSpace = document.getElementById('memoSpaceTd').hidden;
  const data = { 
    doctor, 
    nameDataSource, 
    locationDataSource, 
    enableClipboard, 
    autoPresetApply,
    isAddTitleCol,
    isDisableFeedback, 
    presets, 
    presetShowSize, 
    isPresetAutoCollapse, 
    isForceLightDarkChange, 
    customDarkColor,
    isHiddenMemoSpace
  };

  localStorage.setItem('MiGTAKarteGeneratorData', JSON.stringify(data));
}

function loadData() {
  const data = JSON.parse(localStorage.getItem('MiGTAKarteGeneratorData'));

  if (data) {
    document.getElementById('doctor').value = data.doctor ? data.doctor : "";
    document.getElementById('nameDataSource').value = data.nameDataSource ? data.nameDataSource : "";
    document.getElementById('locationDataSource').value = data.locationDataSource ? data.locationDataSource : "";
    document.getElementById('enableClipboard').checked = data.enableClipboard ? data.enableClipboard : false;
    document.getElementById('autoPresetApply').checked = data.autoPresetApply ? data.autoPresetApply : false;
    document.getElementById('addTitleCol').checked = data.isAddTitleCol ? data.isAddTitleCol : false;
    document.getElementById('disableFeedback').checked = data.isDisableFeedback ? data.isDisableFeedback : false;
    document.getElementById('presetSelect').size = data.presetShowSize ? data.presetShowSize : 4;
    document.getElementById('presetAutoCollapse').checked = data.isPresetAutoCollapse ? data.isPresetAutoCollapse : false;
    document.getElementById('forceLightDarkChange').checked = data.isForceLightDarkChange ? data.isForceLightDarkChange : false;
    document.getElementById('memoSpaceTd').hidden = data.isHiddenMemoSpace ? data.isHiddenMemoSpace : false;
    presets = data.presets ? data.presets : [];
    if (data.customDarkColor && data.customDarkColor.isActive == true) {
      customDarkColor.isActive = true;
      customDarkColor.color.text = data.customDarkColor.color.text ? data.customDarkColor.color.text : '#cccccc';
      customDarkColor.color.bg = data.customDarkColor.color.bg ? data.customDarkColor.color.bg : '#202020';
      customDarkColor.color.bt = data.customDarkColor.color.bt ? data.customDarkColor.color.bt : '#424242';
      customDarkColor.color.btD = data.customDarkColor.color.btD ? data.customDarkColor.color.btD : '#888888';
      customDarkColor.color.border = data.customDarkColor.color.border ? data.customDarkColor.color.border : '#666666';
      customDarkColor.color.accent = data.customDarkColor.color.accent ? data.customDarkColor.color.accent : '#d69739';
    }
    refreshCdValue();
  }
}

function exportData() {
  const doctor = document.getElementById('doctor').value;
  const nameDataSource = document.getElementById('nameDataSource').value;
  const locationDataSource = document.getElementById('locationDataSource').value;
  const data = { doctor, nameDataSource, locationDataSource, presets, customDarkColor };
  const jsonData = JSON.stringify(data);
  const blob = new Blob([jsonData], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "MiGTAKarteGeneratorBackup.json"; // ダウンロードするファイルの名前
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

function applyLightDark(){
  // StyleSetting
  const mystyle = document.getElementById('mystyle');
  // カスタムダークモード設定ボタン
  const customDarkmodeButtonSpan = document.getElementById('customDarkmodeButtonSpan');

  // ブラウザがダークモードかどうかの判定
  const isBrowserSettingDarkmode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // 強制切替有効かどうか判定
  const isForceChangeLightDark = document.getElementById('forceLightDarkChange').checked;
  
  let isDarkmode = isBrowserSettingDarkmode;
  if (isForceChangeLightDark){
    isDarkmode = !isDarkmode;
  }

  if (isDarkmode){
    mystyle.href = 'css/darkstyle.css';
    customDarkmodeButtonSpan.hidden = false;
    cdApply();
  } else {
    mystyle.href = 'css/lightstyle.css';
    customDarkmodeButtonSpan.hidden = true;
  }
}

//ダークモードリアルタイム監視
const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
darkModeMediaQuery.addListener((e) => {
  applyLightDark();
});

function cdApply(){
  const cssRoot = document.querySelector(':root');
  cssRoot.style.setProperty('--main-text', customDarkColor.color.text);
  cssRoot.style.setProperty('--main-bg', customDarkColor.color.bg);
  cssRoot.style.setProperty('--main-border', customDarkColor.color.border);
  cssRoot.style.setProperty('--main-bt', customDarkColor.color.bt);
  cssRoot.style.setProperty('--main-bt-disabled', customDarkColor.color.btD);
  cssRoot.style.setProperty('--main-accent', customDarkColor.color.accent);
}

function toggleShowCustomDarkmode(){
  const customDarkmodeSpan = document.getElementById('customDarkmodeSpan');
  customDarkmodeSpan.hidden = !customDarkmodeSpan.hidden;
}

function refreshCdValue(){
  document.getElementById('cdText').value = customDarkColor.color.text;
  document.getElementById('cdBg').value = customDarkColor.color.bg;
  document.getElementById('cdBorder').value = customDarkColor.color.border;
  document.getElementById('cdBt').value = customDarkColor.color.bt;
  document.getElementById('cdBtD').value = customDarkColor.color.btD;
  document.getElementById('cdAccent').value = customDarkColor.color.accent;
}

function toBase64(num) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+=";
  let result = "";
  
  if (num === 0) {
      return chars[0];
  }
  
  while (num > 0) {
      result = chars[num % 64] + result;
      num = Math.floor(num / 64);
  }
  
  return result;
}

function parseBase64(str) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+=";
  const base = 64;
  let num = 0;
  
  for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const value = chars.indexOf(char);
      num = num * base + value;
  }
  
  return num;
}

function refreshCdShareValue(){
  let cdCode = ["","",""];
  cdCode[0] += customDarkColor.color.text.slice(-6);
  cdCode[0] += customDarkColor.color.bg.slice(-6);
  cdCode[1] += customDarkColor.color.border.slice(-6);
  cdCode[1] += customDarkColor.color.bt.slice(-6);
  cdCode[2] += customDarkColor.color.btD.slice(-6);
  cdCode[2] += customDarkColor.color.accent.slice(-6);
  let cdInt = [0,0,0];
  let cdx64 = ["","",""];
  cdInt[0] = parseInt(cdCode[0],16);
  cdInt[1] = parseInt(cdCode[1],16);
  cdInt[2] = parseInt(cdCode[2],16);
  for (let i = 0 ; i < 3; i++){
    cdInt[i] = parseInt(cdCode[i],16);
    cdx64[i] = toBase64(cdInt[i]);
    while (cdx64[i].length < 8){
      cdx64[i] = '0' + cdx64[i];
    }
  }
  document.getElementById('cdShare').value = cdx64.join('');
}

function importCd(){
  const cdShareInput = document.getElementById('cdShareInput').value;
  let cdx64 = ['','',''];
  let cdInt = [0,0,0];
  let cdx16 = ['','',''];
  for(let i = 0; i < 3; i++){
    cdx64[i] = cdShareInput.slice(i * 8, (i+1)*8);
    cdInt[i] = parseBase64(cdx64[i]);
    cdx16[i] = cdInt[i].toString(16);
    while (cdx16[i].length < 12){
      cdx16[i] = '0' + cdx16[i];
    }
  }
  customDarkColor.color.text = "#" + cdx16[0].slice(0,6);
  customDarkColor.color.bg = "#" + cdx16[0].slice(6,12);
  customDarkColor.color.border = "#" + cdx16[1].slice(0,6);
  customDarkColor.color.bt = "#" + cdx16[1].slice(6,12);
  customDarkColor.color.btD = "#" + cdx16[2].slice(0,6);
  customDarkColor.color.accent = "#" + cdx16[2].slice(6,12);
  customDarkColor.isActive = true;
  cdApply();
  refreshCdValue();
  refreshCdShareValue();
  saveData();
}

function cdAccept(){
  const cdText = document.getElementById('cdText').value;
  const cdBg = document.getElementById('cdBg').value;
  const cdBorder = document.getElementById('cdBorder').value;
  const cdBt = document.getElementById('cdBt').value;
  const cdBtD = document.getElementById('cdBtD').value;
  const cdAccent = document.getElementById('cdAccent').value;
  customDarkColor.isActive = true;
  customDarkColor.color.text = cdText;
  customDarkColor.color.bg = cdBg;
  customDarkColor.color.border = cdBorder;
  customDarkColor.color.bt = cdBt;
  customDarkColor.color.btD = cdBtD;
  customDarkColor.color.accent = cdAccent;
  saveData();
  cdApply();
  refreshCdShareValue();
}

function cdReset(){
  if(window.confirm('カスタムダークモードをリセットしますか？(元に戻せません)')){
    customDarkColor = {
      isActive: false,
      color: {
        text: '#cccccc',
        bg: '#202020',
        bt: '#424242',
        btD: '#888888',
        border: '#666666',
        accent: '#d69739'
      }
    }
    saveData();
    cdApply();
    refreshCdValue();
    refreshCdShareValue();
    toggleShowCustomDarkmode();
  }
}

// ページ読み込み時のデータ読み込み処理など
document.addEventListener('DOMContentLoaded', function() {
  loadData();
  clearInput();
  applyLightDark();

  //インポート処理
  document.getElementById('importData').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    event.target.value = "";
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;

      // テキストをJSONとして解析
      try {
        const json = JSON.parse(text);
        if(json){
          document.getElementById('doctor').value = json.doctor ? json.doctor : "";
          document.getElementById('nameDataSource').value = json.nameDataSource ? json.nameDataSource : "";
          document.getElementById('locationDataSource').value = json.locationDataSource ? json.locationDataSource : "";
          presets = json.presets ? json.presets : [];
          if(json.customDarkColor && json.customDarkColor.isActive == true){
            customDarkColor = json.customDarkColor;
            cdApply();
            refreshCdValue();
            refreshCdShareValue();
          }
          saveData();
          clearInput();
        }
      } catch (error) {
        console.error('JSONの解析に失敗しました:', error);
      }
    };

    // ファイルの内容をテキストとして読み込む
    reader.readAsText(file);
  });
  isLoaded = true;
});

function addMultipleName() {
  const nameSearchBox = document.getElementById('nameSearchBox');
  let leftSelect = document.getElementById("nameResultSelect");
  let rightSelect = document.getElementById("multipleNameSelect");

  // 左のセレクト要素で選択されているオプションを取得
  let selectedOptions = leftSelect.selectedOptions;

  // 選択されている各オプションを右のセレクト要素に追加
  for (let i = 0; i < selectedOptions.length; i++) {
    let option = selectedOptions[i];
    // 新しいオプション要素を作成して右のセレクト要素に追加
    rightSelect.appendChild(option.cloneNode(true));
  }

  if (selectedOptions.length > 0){
    nameSearchBox.value = '';
  }
}

function copyTextToClipboard(text) {
  navigator.clipboard.writeText(text).then(function() {
    let clipboardResult = document.getElementById('clipboardResult');
    clipboardResult.innerText = "クリップボードにコピーしました。";
    clipboardResult.classList.add('fade-out'); // テキストを可視状態にする

    setTimeout(function() {
      clipboardResult.innerText = "";
      clipboardResult.classList.remove('fade-out'); // 2秒後に透明度を0にして徐々に消す
    }, 1950); // 表示してから透明度を変更するまでの時間

  }).catch(function(err) {
    clipboardResult.innerText = "クリップボードのコピーに失敗しました。";
    clipboardResult.classList.add('fade-out'); // テキストを可視状態にする

    setTimeout(function() {
      clipboardResult.innerText = "";
      clipboardResult.classList.remove('fade-out'); // 2秒後に透明度を0にして徐々に消す
    }, 1950); // 表示してから透明度を変更するまでの時間
  });
}

function presetUpdateSelectOptions() {
  const resultSelect = document.getElementById('presetSelect');
  resultSelect.innerHTML = ''; // select要素をクリア
  presets.forEach(function(preset) {
    const option = document.createElement('option');
    option.text = preset.name;
    resultSelect.add(option);
  });
}

function applyPreset(){
  const presetSelect = document.getElementById('presetSelect');
  const selectedIndex = presetSelect.selectedIndex;

  const preset = presets[selectedIndex];

  document.getElementById('locationSearchBox').value = preset.locationSearchBox;
  locationUpdateSelectOptions();
  document.getElementById('symptomA').checked = preset.symptomA; //打撲
  document.getElementById('symptomB').checked = preset.symptomB; //出血
  document.getElementById('symptomC').checked = preset.symptomC; //銃創
  document.getElementById('symptomD').checked = preset.symptomD; //火傷
  document.getElementById('symptomE').checked = preset.symptomE; //気絶
  document.getElementById('transportA').checked = preset.transportA; //本病院
  document.getElementById('transportB').checked = preset.transportB; //北病院
  document.getElementById('transportC').checked = preset.transportC; //砂漠病院
  billingUpdateSelectOptions();
  document.getElementById('billing').value = preset.billing;
  document.getElementById('remarks').value = preset.remarks;
  document.getElementById('feedback').value = preset.feedback;
  document.getElementById('locationResultSelect').value = preset.selectedLocation;
  document.getElementById('disableLocationSearch').checked = preset.disableLocationSearch;
  document.getElementById('disableLocationSearchDescription').hidden = preset.disableLocationSearchDescription;
  document.getElementById('unknownLocation').checked = preset.unknownLocation;
  document.getElementById('cureLocationSamePlace').checked = preset.cureLocationSamePlace;
  document.getElementById('cureLocationMainHospital').checked = preset.cureLocationMainHospital;
  document.getElementById('cureLocationNorthHospital').checked = preset.cureLocationNorthHospital;
  document.getElementById('cureLocationUserInput').checked = preset.cureLocationUserInput;
  document.getElementById('cureLocationText').value = preset.cureLocationText;
  document.getElementById('cureLocationMainJail').checked = preset.cureLocationMainJail ? preset.cureLocationMainJail : false;
  document.getElementById('cureLocationSouthJail').checked = preset.cureLocationSouthJail ? preset.cureLocationSouthJail : false;
  document.getElementById('cureLocationEastJail').checked = preset.cureLocationEastJail ? preset.cureLocationEastJail : false;
  document.getElementById('cureLocationNorthJail').checked = preset.cureLocationNorthJail ? preset.cureLocationNorthJail : false;
  document.getElementById('cureLocationDesertJail').checked = preset.cureLocationDesertJail ? preset.cureLocationDesertJail : false;

  const isPresetAutoCollapse = document.getElementById('presetAutoCollapse').checked;
  if(isPresetAutoCollapse){
    collapsePreset();
  }
}

function generatePreset(){
  const name = document.getElementById('presetName').value;
  const locationSearchBox = document.getElementById('locationSearchBox').value;
  const billing = document.getElementById('billing').value;
  const remarks = document.getElementById('remarks').value;
  const feedback = document.getElementById('feedback').value;
  const symptomA = document.getElementById('symptomA').checked; //打撲
  const symptomB = document.getElementById('symptomB').checked; //出血
  const symptomC = document.getElementById('symptomC').checked; //銃創
  const symptomD = document.getElementById('symptomD').checked; //火傷
  const symptomE = document.getElementById('symptomE').checked; //気絶
  const transportA = document.getElementById('transportA').checked; //本病院
  const transportB = document.getElementById('transportB').checked; //北病院
  const transportC = document.getElementById('transportC').checked; //砂漠病院
  const selectedLocation = document.getElementById('locationResultSelect').value;
  const disableLocationSearch = document.getElementById('disableLocationSearch').checked;
  const disableLocationSearchDescription = document.getElementById('disableLocationSearchDescription').hidden;
  const unknownLocation = document.getElementById('unknownLocation').checked;
  const cureLocationSamePlace = document.getElementById('cureLocationSamePlace').checked;
  const cureLocationMainHospital = document.getElementById('cureLocationMainHospital').checked;
  const cureLocationNorthHospital = document.getElementById('cureLocationNorthHospital').checked;
  const cureLocationUserInput = document.getElementById('cureLocationUserInput').checked;
  const cureLocationText = document.getElementById('cureLocationText').value;
  const cureLocationMainJail = document.getElementById('cureLocationMainJail').checked;
  const cureLocationSouthJail = document.getElementById('cureLocationSouthJail').checked;
  const cureLocationEastJail = document.getElementById('cureLocationEastJail').checked;
  const cureLocationNorthJail = document.getElementById('cureLocationNorthJail').checked;
  const cureLocationDesertJail = document.getElementById('cureLocationDesertJail').checked;

  const presetData = {
    name,
    locationSearchBox,
    billing,
    remarks,
    feedback,
    symptomA,
    symptomB,
    symptomC,
    symptomD,
    symptomE,
    transportA,
    transportB,
    transportC,
    selectedLocation,
    disableLocationSearch,
    disableLocationSearchDescription,
    unknownLocation,
    cureLocationSamePlace,
    cureLocationMainHospital,
    cureLocationNorthHospital,
    cureLocationUserInput,
    cureLocationText,
    cureLocationMainJail,
    cureLocationSouthJail,
    cureLocationEastJail,
    cureLocationNorthJail,
    cureLocationDesertJail
  }

  return presetData;

}

function addPreset(){
  const presetSelect = document.getElementById('presetSelect');
  presets.push(generatePreset());
  presetUpdateSelectOptions();
  presetSelect.selectedIndex = presetSelect.length - 1;
  saveData();
}


function savePreset(){
  const presetSelect = document.getElementById('presetSelect');
  const selectedIndex = presetSelect.selectedIndex;

  presets[selectedIndex] = generatePreset();
  presetUpdateSelectOptions();
  presetSelect.selectedIndex = selectedIndex;
  saveData();
}

function deletePreset(){
  const presetSelect = document.getElementById('presetSelect');
  const presetName = document.getElementById('presetName');
  const selectedIndex = presetSelect.selectedIndex;
  if(selectedIndex != -1){
    presets.splice(selectedIndex, 1);
    presetUpdateSelectOptions();
    presetName.value = "";
  }
  saveData();
}

function changePresetSelect(){
  const presetSelect = document.getElementById('presetSelect');
  const presetOption = presetSelect.selectedOptions[0];
  const presetName = document.getElementById('presetName');
  const autoPresetApply = document.getElementById('autoPresetApply').checked
  presetName.value = presetOption.value;
  if(autoPresetApply){
    applyPreset();
  }
}

function replaceArrayElements(array, targetId, sourceId) {
  return array.reduce((resultArray, element, id, originalArray) => [
    ...resultArray,
    id === targetId ? originalArray[sourceId] :
    id === sourceId ? originalArray[targetId] :
    element
  ], []);
}

function presetMoveUp() {
  const presetSelect = document.getElementById('presetSelect');
  const selectedIndex = presetSelect.selectedIndex;
  if (selectedIndex > 0){
    presets = replaceArrayElements(presets, selectedIndex, selectedIndex - 1);
    presetUpdateSelectOptions()
    presetSelect.selectedIndex = selectedIndex - 1;
    saveData();
  }
}

function presetMoveDown() {
  const presetSelect = document.getElementById('presetSelect');
  const selectedIndex = presetSelect.selectedIndex;
  if (selectedIndex < presetSelect.length - 1){
    presets = replaceArrayElements(presets, selectedIndex, selectedIndex + 1);
    presetUpdateSelectOptions()
    presetSelect.selectedIndex = selectedIndex + 1;
    saveData();
  }
}

//Wanted Finder側機能。（救急隊用拡張）検索してハイライト表示する機能
function highlightWanted(){
  const wantedOptions = document.getElementById('wantedList').options;
  const nameResultSelectedOptions = document.getElementById('nameResultSelect').options;
  const multipleNameSelectedOptions = document.getElementById('multipleNameSelect').options;
  const nameSearchBox = document.getElementById('nameSearchBox').value;
  const checkNameRegisterWanted = document.getElementById('checkNameRegisterWanted').checked;
  const checkNameRegisterWantedResultDiv = document.getElementById('checkNameRegisterWantedResultDiv');
  const checkNameRegisterWantedResult = document.getElementById('checkNameRegisterWantedResult');
  const loadedData = JSON.parse(localStorage.getItem('MiGTAWantedCheckerData'));
  let selectedValue = new Set();
  let unregisterName = [];
  if ((nameSearchBox != '' || multipleNameSelectedOptions.length > 0 || checkNameRegisterWanted) && loadedData){
    //それぞれのselectのoption値を検索用Setに投入
    for (const option of nameResultSelectedOptions){
      selectedValue.add(normalizeString(option.value));
    }
    for (const option of multipleNameSelectedOptions){
      selectedValue.add(normalizeString(option.value));
    }

    for (let i = 0; i < loadedData.length; i++){
      if (loadedData[i].isActive == false){
        continue;
      }
      if (selectedValue.has(normalizeString(loadedData[i].name))){
        wantedOptions[i].classList.add('highlightedWanted');
      }else {
        wantedOptions[i].classList.remove('highlightedWanted');
        unregisterName.push(loadedData[i].name);
      }
    }
    checkNameRegisterWantedResult.value = unregisterName.join(';\n') + ';';
  } else {
    for (const option of wantedOptions){
      option.classList.remove('highlightedWanted');
    }
  }
  checkNameRegisterWantedResultDiv.hidden = !checkNameRegisterWanted;
  return;
}

function toggleShowFeedback(){
  const divFeedback = document.getElementById('divFeedback');
  const disableFeedback = document.getElementById('disableFeedback');
  divFeedback.hidden = disableFeedback.checked;
}

function showPreset(){
  const presetTable = document.getElementById('presetTable');
  const showPresetButton = document.getElementById('showPresetButton');
  presetTable.hidden = false;
  showPresetButton.hidden = true;
}

function collapsePreset(){
  const presetTable = document.getElementById('presetTable');
  const showPresetButton = document.getElementById('showPresetButton');
  presetTable.hidden = true;
  showPresetButton.hidden = false;
}

function presetSizeChange(diff){
  const presetSelect = document.getElementById('presetSelect');
  const presetSize = presetSelect.size + parseInt(diff) >= 2 ? presetSelect.size + parseInt(diff) : 2;
  presetSelect.size = presetSize;
  saveData();
}

function memoclear() {
  document.getElementById('memospace').value = "";
}

function switchDisplayMemo(){
  const memoSpaceTd =  document.getElementById('memoSpaceTd');
  memoSpaceTd.hidden = !(memoSpaceTd.hidden);
  saveData();
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('nameSearchBox').addEventListener('input',(event)=>{highlightWanted()});
  document.getElementById('multipleNameSelectAdd').addEventListener('click',(event)=>{highlightWanted()});
  document.getElementById('multipleNameSelectRemove').addEventListener('click',(event)=>{highlightWanted()});
  document.getElementById('karteClearButton').addEventListener('click',(event)=>{highlightWanted()});
  document.getElementById('checkNameRegisterWanted').addEventListener('change',(event)=>{highlightWanted()});
  document.getElementById('switchEnableWantedButton').addEventListener('click',(event)=>{highlightWanted()});
});
