/*
 Spritz Speed Reader by Charlotte Dann
 local storage implementation by Keith Wyland
 */


var $wpm = $('#spritz_wpm');
var interval = 60000/$wpm.val();
var paused = false;
var $space = $('#spritz_word');
var i = 0;
var night = false;
var zoom = 1;
var autosave = true;
var $words = $('#spritz_words');
var local_spritz = {};

function words_load() {
    if (!localStorage.jqspritz) {
        words_set();
        word_show(0);
        word_update();
        spritz_pause(true);
    } else {
        local_spritz = JSON.parse(localStorage['jqspritz']);
        $words.val(local_spritz.words);
        i = local_spritz.word;
        if (local_spritz.night) {
            night = true
            $('html').addClass('night');
        };
        if (local_spritz.autosave) {
            autosave = true;
            $('html').addClass('autosave');
            $('#autosave_checkbox').prop('checked', true);
        };
        $wpm.val(local_spritz.wpm);
        interval = 60000/local_spritz.wpm;

        if (local_spritz.zoom) {
            zoom = local_spritz.zoom;
            spritz_zoom_set(zoom);
        } else {
            spritz_zoom(0);
        }

        words_set();
        word_show(i);
        word_update();
        spritz_pause(true);
        spritz_alert('loaded');
    }
}
function words_save() {
    local_spritz = {
        word: i,
        words: $words.val(),
        wpm: $wpm.val(),
        night: night,
        autosave: autosave,
        zoom: zoom
    };
    localStorage['jqspritz'] = JSON.stringify(local_spritz);
    if (!autosave) {
        spritz_alert('saved');
    } else {
        button_flash('save', 500);
    }
}


/* TEXT PARSING */
function words_set() {
    words = $words.val().trim()
        .replace(/([-—])(\w)/g, '$1 $2')
        .replace(/[\r\n]/g, ' {linebreak} ')
        .replace(/[ \t]{2,}/g, ' ')
        .split(' ');
    for (var j = 1; j < words.length; j++) {
        words[j] = words[j].replace(/{linebreak}/g, '   ');
    }
}
/* ON EACH WORD */
function word_show(i) {
    $('#spritz_progress').width(100*i/words.length+'%');
    var word = words[i];
    var stop = Math.round((word.length+1)*0.4)-1;
    $space.html('<div>'+word.slice(0,stop)+'</div><div>'+word[stop]+'</div><div>'+word.slice(stop+1)+'</div>');
}
function word_next() {
    i++;
    word_show(i);
}
function word_prev() {
    i--;
    word_show(i);
}

/* ITERATION FUNCTION */
function word_update() {
    spritz = setInterval(function() {
        word_next();
        if (i+1 == words.length) {
            setTimeout(function() {
                $space.html('');
                spritz_pause(true);
                i = 0;
                word_show(0);
            }, interval);
            clearInterval(spritz);
        };
    }, interval);
}

/* PAUSING FUNCTIONS */
function spritz_pause(ns) {
    if (!paused) {
        clearInterval(spritz);
        paused = true;
        $('html').addClass('paused');
        if (autosave && !ns) {
            words_save();
        };
    }
}
function spritz_play() {
    word_update();
    paused = false;
    $('html').removeClass('paused');
}
function spritz_flip() {
    if (paused) {
        spritz_play();
    } else {
        spritz_pause();
    };
}

/* SPEED FUNCTIONS */
function spritz_speed() {
    interval = 60000/$('#spritz_wpm').val();
    if (!paused) {
        clearInterval(spritz);
        word_update();
    };
    $('#spritz_save').removeClass('saved loaded');
}
function spritz_faster() {
    if ($('#spritz_wpm').val() < 1000) {
        $('#spritz_wpm').val(parseInt($('#spritz_wpm').val())+50);
    }
    spritz_speed();
}
function spritz_slower() {
    if ($('#spritz_wpm').val() > 50) {
        $('#spritz_wpm').val(parseInt($('#spritz_wpm').val())-50);
    }
    spritz_speed();
}

/* JOG FUNCTIONS */
function spritz_back() {
    spritz_pause();
    if (i >= 1) {
        word_prev();
    };
}
function spritz_forward() {
    spritz_pause();
    if (i < words.length) {
        word_next();
    };
}

function spritz_zoom_set(s){
    $('#spritz').css('font-size', s+'em');
}

/* WORDS FUNCTIONS */
function spritz_zoom(c) {
    if(zoom+c > 0.6 && zoom+c < 4.2){
        zoom = zoom+c;
        $('#spritz').css('font-size', zoom+'em');
    }
}
function spritz_refresh() {
    clearInterval(spritz);
    words_set();
    i = 0;
    spritz_pause();
    word_show(0);
};
function spritz_select() {
    $words.select();
};
function spritz_expand() {
    $('html').toggleClass('fullscreen');
}

/* ALERT FUNCTION */
function spritz_alert(type) {
    var msg = '';
    switch (type) {
        case 'loaded':
            msg = 'Data loaded from local storage';
            break;
        case 'saved':
            msg = 'Words, Position and Settings have been saved in local storage for the next time you visit';
            break;
    }
    $('#alert').text(msg).fadeIn().delay(2000).fadeOut();
}



/* CONTROLS */
$('#spritz_wpm').on('input', function() {
    spritz_speed();
});
$('.controls').on('click', 'a, label', function() {
    switch (this.id) {
        case 'spritz_slower':
            spritz_slower(); break;
        case 'spritz_faster':
            spritz_faster(); break;
        case 'spritz_save':
            words_save(); break;
        case 'spritz_pause':
            spritz_flip(); break;
        case 'spritz_smaller':
            spritz_zoom(-0.2); break;
        case 'spritz_bigger':
            spritz_zoom(0.2); break;
        case 'spritz_refresh':
            spritz_refresh(); break;
        case 'spritz_select':
            spritz_select(); break;
        case 'spritz_expand':
            spritz_expand(); break;
    };
    return false;
});
$('.controls').on('click', 'a', function() {
    switch (this.id) {
        case 'spritz_back':
            spritz_jog_back = setInterval(function() {
                spritz_back();
            }, 100);
            break;
        case 'spritz_forward':
            spritz_jog_forward = setInterval(function() {
                spritz_forward();
            }, 100);
            break;
    };
});
$('.controls').on('click', 'a', function() {
    switch (this.id) {
        case 'spritz_back':
            clearInterval(spritz_jog_back); break;
        case 'spritz_forward':
            clearInterval(spritz_jog_forward); break;
    };
});

/* KEY EVENTS */
function button_flash(btn, time) {
    var $btn = $('.controls a.'+btn);
    $btn.addClass('active');
    if (typeof(time) === 'undefined') time = 100;
    setTimeout(function() {
        $btn.removeClass('active');
    }, time);
}
$(document).on('keyup', function(e) {
    if (e.target.tagName.toLowerCase() != 'body') {
        return;
    };
    switch (e.keyCode) {
        case 32:
            spritz_flip(); button_flash('pause'); break;
        case 37:
            spritz_back(); button_flash('back'); break;
        case 38:
            spritz_faster(); button_flash('faster'); break;
        case 39:
            spritz_forward(); button_flash('forward'); break;
        case 40:
            spritz_slower(); button_flash('slower'); break;
    };
});
$(document).on('keydown', function(e) {
    if (e.target.tagName.toLowerCase() != 'body') {
        return;
    };
    switch (e.keyCode) {
        case 37:
            spritz_back(); button_flash('back'); break;
        case 39:
            spritz_forward(); button_flash('forward'); break;
    };
});



/* INITIATE */
words_load();

/* LIGHT/DARK THEME */
$('.light').on('click', function() {
    $('html').toggleClass('night');
    night = !night;
    return false;
});