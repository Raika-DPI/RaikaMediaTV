$ = jQuery.noConflict();

var guide = null;
var currentProgrammeID = null;
var fetchNewGuide = false;
var buildGuide = true;

//Start load cdn fallback scripts
var scripts = document.querySelectorAll("script[data-fallback]");
[].forEach.call(scripts, function(script) {
    var listener = script.addEventListener("error", function() {
        var newScript = document.createElement("script");
        newScript.setAttribute("src", script.getAttribute("data-fallback"));
        document.querySelector("head").appendChild(newScript);
    });
});
//End load cdn fallback scripts

//accurate second clock
const accurateTimer = (fn, time = 1000) => {
    let nextAt, timeout;
    nextAt = new Date().getTime() + time;
   
    const wrapper = () => {
        nextAt += time;
        timeout = setTimeout(wrapper, nextAt - new Date().getTime());
        fn();
    };
   
    const cancel = () => clearTimeout(timeout);
    timeout = setTimeout(wrapper, nextAt - new Date().getTime());
    return { cancel };
};

let timer = accurateTimer(() => tick(), 1000);

//fetch the xml tv guide on ready
$(document).ready(async function() {
    try {
        let data = await getTVGuide();
        var x2js = new X2JS();
        guide = x2js.xml2json(data);
        buildGuide = true;
    } catch(error) {
        console.log(error);
    }
});

//fetch the xml tv guide
function getTVGuide() {   
    return $.get({
        url: 'https://guide.raikamedia.cc/iptv/xmltv.xml',
    });
}

//ran every second exactly off the accurate clock tick
function tick() {
    //if the local tv guide variable exists
    if(guide) {
        //if a current programme has not been identified, find it
        if(currentProgrammeID == null) {
            var done = false;
            //loop every programme in the tv guide
            for(let x in guide.tv.programme) {
                var current = Date.now();
                current = parseInt(new Date(new Date(current).toISOString()).getTime());

                var start = guide.tv.programme[x]._start.replace(/\s/g, "");
                var stop = guide.tv.programme[x]._stop.replace(/\s/g, "");

                start = parseInt(new Date(new Date(Date.parse(parseCustomDate(start))).toISOString()).getTime());
                stop = parseInt(new Date(new Date(Date.parse(parseCustomDate(stop))).toISOString()).getTime());

                if(current > start && current < stop) {
                    currentProgrammeID = parseInt(x);
                    setCurrentProgrammes();
                    buildTVGuide();
                    done = true;
                    break;
                }
            }
        } else { //else determine when the current programme will finish
            var current = Date.now();
            current = parseInt(new Date(new Date(current).toISOString()).getTime());
            var stop = guide.tv.programme[currentProgrammeID]._stop.replace(/\s/g, "");
            stop = parseInt(new Date(new Date(Date.parse(parseCustomDate(stop))).toISOString()).getTime());

            //once difference between stop time and current time is less than zero, the programme needs to switch
            if(stop - current < 0) {
                currentProgrammeID = null;
            }
        }

        //if we need to build the tv guide build it, else update it
        if(buildGuide == true) {
            buildTVGuide();
        } 
    }
}

const delay = millis => new Promise((resolve, reject) => {
    setTimeout(_ => resolve(), millis)
});

var card1 = $('.schedule-card.one');
var img1 = card1.find('img');
var card2 = $('.schedule-card.two');
var img2 = card2.find('img');
var card3 = $('.schedule-card.three');
var img3 = card3.find('img');

//function to update the tv shows in the header
async function setCurrentProgrammes() {
    $('.schedule-cards .schedule-card img').attr('src', 'imgs/loading.gif');

    await delay(1000);

    const imageTypes = ["Primary", "Art", "Backdrop", "Banner", "Box", "BoxRear", "Disc", "Logo", "Menu", "Screenshot", "Thumb"];

    var current = guide.tv.programme[currentProgrammeID];
    if(current) {
        $('.now-playing .title').text(current.title + '//');
        if(current.icon) {
            var src = guide.tv.programme[currentProgrammeID].icon._src;
            if(src) {
                img1.attr('src', src.replace('Primary', imageTypes[2]));
                img1.attr('onerror', "javascript:this.src='" + src + "'");
            } else {
                img1.attr('src', 'imgs/loading.gif');
            }
        } else {
            img1.attr('src', 'imgs/loading.gif');
        }
    } else {
        img1.attr('src', 'imgs/loading.gif');
        fetchNewGuide = true;
    }

    var next = guide.tv.programme[currentProgrammeID + 1];
    if(next){
        $('.next-playing .title').text(next.title + '//');
        if(next.icon) {
            var src = guide.tv.programme[currentProgrammeID + 1].icon._src;
            if(src) {
                img2.attr('src', src.replace('Primary', imageTypes[2]));
                img2.attr('onerror', "javascript:this.src='" + src + "'");
            } else {
                img2.attr('src', 'imgs/loading.gif');
            }
        } else {
            img2.attr('src', 'imgs/loading.gif');
        }
    } else {
        img2.attr('src', 'imgs/loading.gif');
        fetchNewGuide = true;
    }

    var after = guide.tv.programme[currentProgrammeID + 2];
    if(after) {
        $('.after-playing .title').text(after.title + '//');
        if(after.icon) {
            var src = guide.tv.programme[currentProgrammeID + 2].icon._src;
            if(src) {
                img3.attr('src', src.replace('Primary', imageTypes[2]));
                img3.attr('onerror', "javascript:this.src='" + src + "'");
            } else {
                img3.attr('src', 'imgs/loading.gif');
            }
        } else {
            img3.attr('src', 'imgs/loading.gif');
        }
    } else {
        img3.attr('src', 'imgs/loading.gif');
        fetchNewGuide = true;
    }

    //if any of the three shows are null then we have reached the end of the tv guide, so fetch a new one
    if(fetchNewGuide == true) {
        try {
            let data = await getTVGuide();
            var x2js = new X2JS();
            guide = x2js.xml2json(data);
            buildGuide = true;
            currentProgrammeID = null;
        } catch(error) {
            console.log(error);
        }
    }
}

var mobile = false;

$(document).ready(function() {
    if($(window).width() <= 768) {
        mobile = true
        $('.next-playing').insertAfter('.schedule-card.two');
        $('.after-playing').insertAfter('.schedule-card.three');
    } else {
        mobile = false;
        $('.next-playing').insertBefore('.schedule-card.two');
        $('.after-playing').insertBefore('.schedule-card.three');
    }

    window.dispatchEvent(new Event('resize'));
});

$(window).on('resize', function() {
    if($(window).width() <= 768) {
        if(mobile == false) { //loaded in mobile or switch to mobile

            $('.next-playing').insertAfter('.schedule-card.two');
            $('.after-playing').insertAfter('.schedule-card.three');

            mobile = true;
        }
    } else {
        if(mobile == true) { //loaded in non mobile or switch to non mobile
            
            $('.next-playing').insertBefore('.schedule-card.two');
            $('.after-playing').insertBefore('.schedule-card.three');

            mobile = false;
        }
    }
});

var card1 = $('.schedule-card.one');
var img1 = card1.find('img');
var card2 = $('.schedule-card.two');
var img2 = card2.find('img');
var card3 = $('.schedule-card.three');
var img3 = card3.find('img');

$('.schedule-card').on('mouseenter', async function() {
    var classList = this.classList;

    if(classList.contains('two')) {
        $('.schedule-cards').addClass('two');
    }

    if(classList.contains('three')) {
        $('.schedule-cards').addClass('three');
    }
});

$('.schedule-card').on('mouseleave', async function() {
    var classList = this.classList;

    setTimeout(function() {
        if(classList.contains('two')) {
            $('.schedule-cards').removeClass('two');
        }
    
        if(classList.contains('three')) {
            $('.schedule-cards').removeClass('three');
        }
    }, 1000);
});

//function to build the tv guide element off of the tv guide xml file
function buildTVGuide() {
    //remove current guide element if one
    $('.guide-container').empty();

    var d2 = new Date(new Date(Date.now()).getTime()+2000*60*60*24);
    var d3 = new Date(new Date(Date.now()).getTime()+3000*60*60*24);
    var d4 = new Date(new Date(Date.now()).getTime()+4000*60*60*24);
    var d5 = new Date(new Date(Date.now()).getTime()+5000*60*60*24);
    var d6 = new Date(new Date(Date.now()).getTime()+6000*60*60*24);

    const weekday = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    $guideElement = $('<div class="guide"></div>');

    $guideSchedule = $(
        `<div class="guide-schedule">
            <div class="guide-schedule-filters">
                <div class="guide-schedule-filter" data-index="1"><span>Today</span></div>
                <div class="guide-schedule-filter" data-index="2"><span>Tomorrow</span></div>
                <div class="guide-schedule-filter" data-index="3"><span>` + weekday[d2.getDay()] + /*`, ` + month[d2.getMonth()] + ` ` + String(d2.getDate()).padStart(2, '0') +*/ `</span></div> 
                <div class="guide-schedule-filter" data-index="4"><span>` + weekday[d3.getDay()] + /*`, ` + month[d3.getMonth()] + ` ` + String(d3.getDate()).padStart(2, '0') +*/ `</span></div> 
                <div class="guide-schedule-filter" data-index="5"><span>` + weekday[d4.getDay()] + /*`, ` + month[d4.getMonth()] + ` ` + String(d4.getDate()).padStart(2, '0') +*/ `</span></div> 
                <div class="guide-schedule-filter" data-index="6"><span>` + weekday[d5.getDay()] + /*`, ` + month[d5.getMonth()] + ` ` + String(d5.getDate()).padStart(2, '0') +*/ `</span></div> 
                <div class="guide-schedule-filter" data-index="7"><span>` + weekday[d6.getDay()] + /*`, ` + month[d6.getMonth()] + ` ` + String(d6.getDate()).padStart(2, '0') +*/ `</span></div> 
            </div>

            <div class="programmes">
                <div class="programmes-container" data-index="1"></div>
                <div class="programmes-container" data-index="2"></div>
                <div class="programmes-container" data-index="3"></div>
                <div class="programmes-container" data-index="4"></div>
                <div class="programmes-container" data-index="5"></div>
                <div class="programmes-container" data-index="6"></div>
                <div class="programmes-container" data-index="7"></div>
            </div>
        </div>`
    );

    $('.guide-container').append($guideSchedule);

    $('.guide-container .guide-schedule .programmes .programmes-container').append($(
        `<table class="responsive collapsed" width="100%">
            <thead>
                <tr>
                    <th data-label="Start Time">Start Time</th>
                    <th data-label="Title">Title</th>
                    <th data-label="Episode">Episode</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>`
    ));

    var index = 0;
    var currentDay = parseInt(new Date(Date.now()).getDay());

    for(let x in guide.tv.programme) {
        if(x >= currentProgrammeID) {
            if(index <= 7) {
                var start = new Date(Date.parse(parseCustomDate(guide.tv.programme[x]._start.replace(/\s/g, ""))));
                var stop = new Date(Date.parse(parseCustomDate(guide.tv.programme[x]._stop.replace(/\s/g, ""))));
                var startDay = parseInt(start.getDate());
    
                if(startDay != currentDay) {
                    currentDay = startDay;
                    index++;
                }

                var hours = start.getHours() ; // gives the value in 24 hours formatv
                var AmOrPm = hours >= 12 ? 'pm' : 'am';
                hours = (hours % 12) || 12;
                var minutes = start.getMinutes() ;
                var finalTime = String(hours).padStart(2, '0') + ":" + String(minutes).padStart(2, '0') + " " + AmOrPm;

                var episode = '';
                var space = '';
                if(guide.tv.programme[x]['episode-num'] && guide.tv.programme[x]['episode-num'][0]) {
                    episode = guide.tv.programme[x]['episode-num'][0];
                    space = ' ';
                }

                var src = null;
                if(guide.tv.programme[x].icon && guide.tv.programme[x].icon && guide.tv.programme[x].icon._src) {
                    src = guide.tv.programme[x].icon._src
                } else {
                    src = 'imgs/loading.gif';
                }

                var rating = null;
                if(guide.tv.programme[x].rating && guide.tv.programme[x].rating.value) {
                    rating = guide.tv.programme[x].rating.value
                }

                var sub_title = '';
                if(guide.tv.programme[x]['sub-title']) {
                    sub_title = episode + space + guide.tv.programme[x]['sub-title'].__text.replace(guide.tv.programme[x].title, '');
                }

                //$('.guide-container .programmes .programmes-container[data-index="' + index + '"]').append($('<div class="programme">' + guide.programme[x].title + '</div>'));
                $('.guide-container .programmes .programmes-container[data-index="' + index + '"] table tbody').append($(
                    `<tr data-src="` + src + `" data-description="` + guide.tv.programme[x].desc + `">
                        <td data-label="Start Time"><span>[</span>` + finalTime + `<span>]</span></td>
                        <td data-label="Title">` + guide.tv.programme[x].title + `</td>
                        <td data-label="Episode">` + sub_title + `</td>
                    </tr>`
                ));
            } else {
                break;
            }
        }
    }

    setGuideFilter(1);

    buildGuide = false;

    $('table').DataTable({
        paging: false,
        ordering: false,
        searching: false,
        select: false,
        info: false,
        lengthChange: false,
        pageLength: 999,
        responsive: {
            details: {
                display: $.fn.dataTable.Responsive.display.childRowImmediate
            }
        }
    })
}

//parse a custom ISO 8601 date string and convert to local date
function parseCustomDate (s) {
    const year = parseInt(s.substr(0, 4), 10);
    const month = parseInt(s.substr(4, 2), 10);
    const day = parseInt(s.substr(6, 2), 10);
    const hour = parseInt(s.substr(8, 2), 10);
    const minute = parseInt(s.substr(10, 2), 10);
    const second = parseInt(s.substr(12, 2), 10);
    const tzSign = s.charAt(14) === '-' ? -1 : 1;
    const tzHour = parseInt(s.substr(15, 2), 10) || 0;
    const tzMinute = parseInt(s.substr(17, 2), 10) || 0;
    const adjustedHour = hour - (tzSign * tzHour);
    const adjustedMinute = minute - (tzSign * tzMinute);
    
    return new Date(Date.UTC(year, month - 1, day, adjustedHour, adjustedMinute, second));
}

/* Start - videojs customization */
var player = new videojs('raikamedia', {
    html5: {
        nativeAudioTracks: false,
        nativeVideoTracks: false,
        hls: {
            overrideNative: true,
        }
    }
});

player.play();

const Button = videojs.getComponent('Button');
const Component = videojs.getComponent('Component');

class GuideMenuButton extends Button {
    constructor(player, options) {
        super(player, options);
        this.addClass('guide-button');
        this.addClass('button');
    }
}
videojs.registerComponent('GuideMenuButton', GuideMenuButton);
player.controlBar.addChild('GuideMenuButton', {}, 9);

class GuideComponentButton extends Component {
    constructor(player, options) {
        super(player, options);
        this.addClass('guide-button');
        this.addClass('component');
    }
}
videojs.registerComponent('GuideComponentButton', GuideComponentButton);
player.addChild('GuideComponentButton', {}, 0);

$('.guide-button.component').hide();
$('.guide-button.component').text('X');
$('.guide-button.button span').text('VIEW SCHEDULE');

$('body').on('click', '.guide-button', function() {
    $('.video-container .guide-container').toggle();
    $('.video-container').toggleClass('guide-active');
    if($('.video-container').hasClass('guide-active')) {
        $('.guide-button.button span').text('HIDE SCHEDULE');
        $('.guide-button.component').show();
    } else {
        $('.guide-button.button span').text('VIEW SCHEDULE');
        $('.guide-button.component').hide();
    }
});

class GuideComponent extends Component {
    constructor(player, options) {
        super(player, options);
        this.addClass('guide-container');
    }
};
videojs.registerComponent('GuideComponent', GuideComponent);
player.addChild('GuideComponent', {}, 0);

/* End - videojs customization */

//on click guide programme, display that programme's information
$('body').on('click', '.guide-programmes .guide-programme', function() {
    setCurrentGuideProgramme($(this));
});

$('body').on('click', '.guide-container .guide-schedule .guide-schedule-filters .guide-schedule-filter', function() {
    setGuideFilter($(this).attr('data-index'));
    $('.guide-schedule-filter').removeClass('active');
    $(this).addClass('active');
});

$('body').on('click', '.guide-container .guide-schedule .programmes .programmes-container table tbody tr:not(.sub-menu):not(.child)', function() {
    if($(this).hasClass('active')) {
        $(this).removeClass('active');
        $('.sub-menu').remove();
    } else {
        $('.sub-menu').remove();

        $('tr.active').removeClass('active');
    
        $(this).addClass('active');

        var src = $(this).attr('data-src');
        var description = $(this).attr('data-description');
    
        $(
            `<tr class="sub-menu">
                <td colspan="1">
                    <img src="` + src + `" alt="show image">
                </td>
                <td colspan="3">
                    ` + description + `
                </td>
            </tr>`
        ).insertAfter($(this));
    }
    
});

$(window).on('click', function() {
    window.dispatchEvent(new Event('resize'));
});

//function to determine the pixel width of a container based on the text inside of it
$.fn.textWidth = function(text, font) {
    if (!$.fn.textWidth.fakeEl) $.fn.textWidth.fakeEl = $('<span>').hide().appendTo(document.body);
    $.fn.textWidth.fakeEl.text(text || this.val() || this.text()).css({
        'font': font || this.css('font'),
        'font-size': '1.125em',
    });
    return $.fn.textWidth.fakeEl.width();
};

//function to set the clicked programme's information
function setCurrentGuideProgramme(element) {
    var src = element.attr('data-src');
    var rating = element.attr('data-rating');
    var episode = element.attr('data-episode');
    var description = element.attr('data-description');
    var title = element.attr('data-title');

    $('.current-guide-programme .guide-programme-image img').attr('src', src);
    $('.current-guide-programme .guide-programme-info .wrapper .title').text(title + ' ' + episode);

    $('.current-guide-programme .guide-programme-info .wrapper .rating').text(rating);

    if(description != 'undefined') {
        $('.current-guide-programme .guide-programme-info .description').text(description);
    }
}

function setGuideFilter(index) {
    $('.guide-container .guide-schedule .guide-schedule-filters .guide-schedule-filter').removeClass('active');
    $('.guide-container .guide-schedule .guide-schedule-filters .guide-schedule-filter[data-index="' + index + '"]').addClass('active');
    $('.guide-container .guide-schedule .programmes .programmes-container').hide();
    $('.guide-container .guide-schedule .programmes .programmes-container[data-index="' + index + '"]').show();
    $('.guide-container .guide-schedule .programmes .programmes-container[data-index="' + index + '"]').addClass('active');
}
