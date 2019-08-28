var domain = 'http://202.115.44.108:81';
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

function getScheduleTableDocument() {
  var mainFrames = document.getElementsByTagName('frame');
  for (var j = 0; j < mainFrames.length; j++) {
    if (mainFrames[j].src == 'http://202.115.44.108:81/main.aspx') {
      var tables = mainFrames[j].contentDocument.getElementsByClassName('templateTable1');
      return tables[1];
    }
  }
  return null;
}

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

function getStartEndTimeFromTime(time, date) {
  var newDate = date.replace(/\\/g, '-');
  var found = TIME_MAP.find(function (ele) {
    return ele.text === time;
  });
  return {
    start: new Date(newDate + found.start),
    end: new Date(newDate + found.end),
  };
}

function makeICS(data) {
  cal = ics();
  for (var item of data) {
    var found = getStartEndTimeFromTime(item.time, item.date);
    cal.addEvent(item.course, item.class, '四川大学商学院', found.start, found.end);
  }
  var s = cal.download('schedule');
}

function main () {
  var frames = document.getElementsByTagName('frame');
  for (var i = 0; i < frames.length; i++) {
    if (frames[i].src == 'http://202.115.44.108:81/Leftmenu.aspx') {
      frames[i].contentWindow.addEventListener('click', function () {
        var res = setTimeout(function () {
          var table = getScheduleTableDocument();
          if (!table) {
            return false;
          }

          var data = table2Json(table);
          makeICS(data);
        }, 1000);
      }, true);
    }
  }
}

main();