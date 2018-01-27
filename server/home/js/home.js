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

    loadStories();
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
        dataType: 'text',
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

function loadStories() {

    // TODO loading bar

    $.ajax({
        url: '/story',
        dataType: 'json',
        cache: false,
        error: (jqXHR, textStatus, errorThrown) => {
            if (textStatus === 'timeout')
                alert('Connection timeout. Could not retrieve stories.');
            else
                alert(`AJAX error. textStatus=${textStatus} and errorThrown=${errorThrown}`);
        },
        success: data => inflateStories(data),
        timeout: 2000
    });
}

function inflateStories(data) {

    data.forEach(story => $('#feed').append(createCard(story)));
}

function createCard(story) {
    let card = $('<div></div>').addClass('card-content');

    card.append($('<div></div>').addClass('chip').text(story.Author));

    if (story.own) {
        let destroy = $('<i class="close material-icons delete-story">close</i>');
        destroy.click(function () {
            // TODO delete the post
        });
        card.append(destroy);
    }

    // TODO make date prettier
    card.append($('<p></p>').addClass('date').text(story.PostDate));
    card.append($('<p></p>').text(story.Content));

    card = $('<div></div>').addClass('card').append(card);
    return $('<div></div>').addClass('col s12 m6').append(card);
}

// TODO ajax refresh get new cards