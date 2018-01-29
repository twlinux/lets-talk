/* global Materialize, Cookies */

$(document).ready(function () {

    $('.button-collapse').sideNav();

    $('#all-modals').load('/components/modal.html', function () {
        $(this).ready(function () {
            $('.modal').modal({
                dismissible: true
            });
            let message = Cookies.get('message');
            if (message) {

                message = JSON.parse(message);
                $('#modal-message-title').text(message.title);
                $('#modal-message-body').text(message.content);
                $('#modal-message').modal('open');
                Cookies.remove('message');
            }
        });
    });

    if (Cookies.get('session'))
        activeSession();
    else
        guest();

    loadStories();
});

function guest() {

    let panel = $('#user-panel');
    panel.load('login.html', function () {
        $(panel).ready(function () {
            $('.collapsible').collapsible();
            $('#create-name').characterCounter();

            $('#create-password').keyup(function () {
                $('#retype-password').attr('pattern', $('#create-password').val());
            });
        });
    });

    $('#create-story-form').click(function () {
        let toastContent = $('<span>You must be signed in to post. </span>');
        toastContent.append($('<i class="material-icons right">mood_bad</i>'));
        Materialize.toast(toastContent, 4000);
    });

    $('#create-story-fieldset').attr('disabled', 'disabled');

}

function activeSession() {

    $('#avatar-container i').replaceWith($('<img src="/assets/smile.svg" width="200px" />'));

    // retrieve name from server
    $.ajax({
        url: '/my_name',
        dataType: 'text',
        statusCode: {
            401: function () {
                document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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
            $('#delete-account').click(function () {
                $('#modal-delete-account').modal('open');
            });
            // TODO retrieve note
            $('#edit-note').click(function () {
                $('#note').removeAttr('disabled');
                let submitButton = $('<button></button>');
                submitButton.addClass('waves-effect waves-light btn');
                submitButton.attr('type', 'submit');
                submitButton.text('Save');
                submitButton.append($('<i class="material-icons right">note_add</i>'));
                $(this).replaceWith(submitButton);
            });

            $.ajax({
                url: '/my_note',
                dataType: 'text',
                cache: false,
                error: (jqXHR, textStatus, errorThrown) => alertAjax(jqXHR, textStatus, errorThrown),
                success: data => $('#note').val(data),
                timeout: 2000
            });
        });
    });
}

function loadStories() {

    if (document.location.search.includes('author'))
        $('.brand-logo').text(new URLSearchParams(document.location.search.substring(1)).get('author'));

    $.ajax({
        url: '/story' + document.location.search, // forward search query params
        dataType: 'json',
        cache: false,
        error: (jqXHR, textStatus, errorThrown) => alertAjax(jqXHR, textStatus, errorThrown),
        success: data => inflateStories(data),
        timeout: 2000
    });
}

function inflateStories(data) {

    data.forEach(story => $('#feed').append(createCard(story)));
}

function createCard(story) {
    let card = $('<div></div>').addClass('card-content');

    let authorChip = $('<div></div>').addClass('chip author').text(story.Author);
    authorChip.click(function () {
        location.replace(`/?author=${encodeURI(story.Author)}`);
    });
    card.append(authorChip);

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
    card.append($('<p></p>').addClass('date').text(story.prettyDate));
    card.append($('<p></p>').html(story.Content).attr('id', story.ID)); // XSS
    // TODO truncate card if content is too long

    card = $('<div></div>').addClass('card').append(card);
    return $('<div></div>').addClass('col s12 m6').append(card);
}

// TODO ajax refresh get new cards

function alertAjax(jqXHR, textStatus, errorThrown) {
    if (textStatus === 'timeout')
        alert(`Connection timeout. url=${jqXHR.requestURL}`);
    else
        alert(`AJAX error. url=${jqXHR.requestURL} textStatus=${textStatus} and errorThrown=${errorThrown}`);
}
