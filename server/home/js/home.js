// TODO jump to top FAB

$(document).ready(function () {

    materializeInit();

    let message = Cookies.get('message');
    if (message) {
        openMessage(message);
        Cookies.remove('message');
    }

    if (Cookies.get('session'))
        activeSession();
    else
        guestMenu();

    $('main').append('jQuery works');
});

function materializeInit() {
    $('.button-collapse').sideNav();
}

function openMessage(message) {
    message = JSON.parse(message);
    $('#modal1-title').text(message.title);
    $('#modal1-body').text(message.content);
    $('.modal').modal({
        dismissible: true
    });
    $('#modal1').modal('open');
}

function guestMenu() {

    $('#login-form').load('user_form.html', function () {

        $('.collapsible').collapsible();
        $('#create-name').characterCounter();

        $('#create-password').keyup(function () {
            $('#retype-password').attr('pattern', $('#create-password').val());
        });
    });
}

function activeSession() {

    let avatar = $('#avatar-container i').replaceWith($('<img src="/assets/smile.svg" width="200px" />'));

    // retrieve name from server
    (function () {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/myname', true);
        xhr.onload = function () {
            if (this.status === 200)
                $('#greeting').text(xhr.responseText);
            else {
                document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                location.reload();
            }
        }
        xhr.send();
    })();

    $('#user-panel').css('display', 'initial');
    $('#change-password').click(function () {
        $('#modal1-title').text('Change password');
        let modal = $('#modal1-body');
        modal.text('');
        let modalButton = $('#modal1-button');
        modalButton.removeClass('waves-green');
        modalButton.addClass('waves-red');
        modalButton.text('Cancel');
        modal.load('password_form.html', function() {
            $('#new-password').ready(function() {
                $('.modal').modal({
                    dismissible: true
                });
                $('#modal1').modal('open');
            });
        });
    });
}
