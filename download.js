var xhr;
var NOTIFY_MINUTES = 30;
var serverHttp = 'https://kuanduhome.com/api/timetables/ics';
var domain = 'http://202.115.44.108:81';
var COUNTDOWN_TIME = 5;
var TABLE_MAP = [
  'date',
  'week',
  'weekdate',
  'time',
  'sequence',
  'class',
  'course',
  'room',
];
var TIME_MAP = [
  {
    text: "上午",
    start: " 9:00:00",
    end: " 12:00:00",
  },
  {
    text: "下午",
    start: " 14:00:00",
    end: " 17:00:00",
  },
  {
    text: "晚上",
    start: " 19:00:00",
    end: " 22:00:00",
  },
];

Date.prototype.Format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份         
    "d+": this.getDate(), //日         
    "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时         
    "H+": this.getHours(), //小时         
    "m+": this.getMinutes(), //分         
    "s+": this.getSeconds(), //秒         
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度         
    "S": this.getMilliseconds() //毫秒         
  };
  var week = {
    "0": "/u65e5",
    "1": "/u4e00",
    "2": "/u4e8c",
    "3": "/u4e09",
    "4": "/u56db",
    "5": "/u4e94",
    "6": "/u516d"
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  if (/(E+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[this.getDay() + ""]);
  }
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    }
  }
  return fmt;
}       

function getStartEndTimeFromTime(time, date) {
  var newDate = date.replace(/\\/g, '-');
  var found = TIME_MAP.find(function (ele) {
    return ele.text === time;
  });
  return {
    start: (new Date(newDate + found.start)).Format("yyyy-MM-dd HH:mm:ss"),
    end: (new Date(newDate + found.end)).Format("yyyy-MM-dd HH:mm:ss"),
  };
}

// transform table dom data to json data.
function table2Json(table) {
  var data = [];
  var trs = table.getElementsByTagName('tr');
  for (var i = 1; i < trs.length; i++) {
    var tds = trs[i].getElementsByTagName('td');
    var item = {};
    for (var j = 0; j < tds.length; j++) {
      item[TABLE_MAP[j]] = tds[j].innerHTML;
    }

    if (Object.keys(item).length) {
      data.push(item);
    }
  }
  return data;
}

// get schedule table data by dom.
function getScheduleTableDocument() {
  var mainFrames = document.getElementsByTagName('frame');
  for (var j = 0; j < mainFrames.length; j++) {
    if (mainFrames[j].src == 'http://202.115.44.108:81/main.aspx') {
      var tables = mainFrames[j].contentDocument.getElementsByClassName('templateTable1');
      if (tables[1]) {
        return tables[1];
      }
    }
  }
  return null;
}

// request for getting ics url.
function getIcsUrl(reqData) {
  var data = '';
  // POST
  if (window.XMLHttpRequest) { // Mozilla, Safari...
    xhr = new XMLHttpRequest();
  } else if (window.ActiveXObject) { // IE
    try {
      xhr = new ActiveXObject('Msxml2.XMLHTTP');
    } catch (e) {
      try {
        xhr = new ActiveXObject('Microsoft.XMLHTTP');
      } catch (e) { }
    }
  }
  if (xhr) {
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var res = xhr.responseText;
          if (res) {
            sendMsgToPop({ cmd: 'QRCODE', value: res });
            return true;
          }
        }
        alert('服务器睡着了，请联系开发人员...：）');
      }
      return false;
    };
    xhr.open('POST', serverHttp);
    // 以json的形式传递数据.
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(reqData));
  }
  return data;
}

function formatTableJson(data) {
  var res = [];
  for (var item of data) {
    var found = getStartEndTimeFromTime(item.time, item.date);
    var roomStr = '四川大学商学院' + item.room;
    res.push({
      course: item.course,
      className: item.class,
      classRoom: roomStr,
      startTime: found.start,
      endTime: found.end,
      notifyMinutes: NOTIFY_MINUTES,
    })
  }
  return res;
}

function getScheduleTableData() {
  var table = getScheduleTableDocument();
  if (!table) {
    return false;
  }
  var json = table2Json(table);
  if (!json || json.length === 0) {
    return false;
  }
  getIcsUrl(formatTableJson(json));
  return true;
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.cmd == "GET_TABLE") {
      var res = getScheduleTableData();
      sendResponse(res);
    }
    sendResponse('听不懂你在说什么');
  }
);

// send message or data to pop js.
function sendMsgToPop(data) {
  chrome.runtime.sendMessage(data);
}