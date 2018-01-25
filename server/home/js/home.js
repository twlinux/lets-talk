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

    let panel = $('#user-panel');
    panel.load('login.html', function () {
        $(panel).ready(function () {
            $('.collapsible').collapsible();
            $('#create-name').characterCounter();

            $('#create-password').keyup(function () {
                $('#retype-password').attr('pattern', $('#create-password').val());
            });
        })
    });
}

function activeSession() {

    let avatar = $('#avatar-container i').replaceWith($('<img src="/assets/smile.svg" width="200px" />'));

    // retrieve name from server
    $.ajax({
        url: '/myname',
        data: 'text',
        statusCode: {
            400: function () {
                document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                location.reload();
            },
            200: (data) => {
                $('#greeting').text(data);
            }
        }
    });

    let panel = $('#user-panel');
    panel.load('account_options.html', function () {
        panel.ready(function () {
            $('#change-password').click(function () {
                $('#modal1-title').text('Change password');
                let modal = $('#modal1-body');
                modal.text('');
                let modalButton = $('#modal1-button');
                modalButton.removeClass('waves-green');
                modalButton.addClass('waves-red');
                modalButton.text('Cancel');
                modal.load('password_form.html', function () {
                    $('#new-password').ready(function () {
                        $('.modal').modal({
                            dismissible: true
                        });
                        $('#modal1').modal('open');
                    });
                });
            });
        });
    });
}
