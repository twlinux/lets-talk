// TODO jump to top FAB

$(document).ready(function () {

    materializeInit();

    let message = Cookies.get('message');
    if (message) {

        message = JSON.parse(message);
        $('#modal-message-title').text(message.title);
        $('#modal-message-body').text(message.content);
        $('#modal-message').modal('open');
        Cookies.remove('message');
    }

    if (Cookies.get('session'))
        activeSession();
    else
        guest();

    loadStories();
});

function materializeInit() {
    $('.button-collapse').sideNav();
    $('.modal').modal({
        dismissible: true
    });
}

function guest() {

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

    $('#create-story-form').click(function() {
        let toastContent = $('<span>You must be signed in to post. </span>');
        toastContent.append($('<i class="material-icons right">mood_bad</i>'));
        Materialize.toast(toastContent, 4000);
    });

    $('#create-story-fieldset').attr('disabled', 'disabled');

}

function activeSession() {

    let avatar = $('#avatar-container i').replaceWith($('<img src="/assets/smile.svg" width="200px" />'));

    // retrieve name from server
    $.ajax({
        url: '/myname',
        dataType: 'text',
        statusCode: {
            401: function () {
                document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                location.reload();
            },
            200: (data) => {
                $('#greeting').text(data);
            }
        }
    });

    let panel = $('#user-panel');
    panel.load('account.html', function () {
        panel.ready(function () {
            $('#change-password').click(function () {
                $('#modal-password').modal('open');
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
            $('#remove-which').attr('value', story.ID);
            $('#modal-remove-preview').text(story.Content);
            $('#modal-remove').modal('open');
        });
        card.append(destroy);
    }

    // TODO make date prettier
    card.append($('<p></p>').addClass('date').text(story.PostDate));
    card.append($('<p></p>').html(story.Content)); // XSS
    // TODO truncate card if content is too long

    card = $('<div></div>').addClass('card').append(card);
    return $('<div></div>').addClass('col s12 m6').append(card);
}

// TODO ajax refresh get new cards