$(document).ready(function () {

    materializeInit();
    // TODO show guest menu when not logged in
    guestMenu();
    $('main').append('jQuery works');
});

function materializeInit() {
    $('.button-collapse').sideNav();
}

function guestMenu() {

    $('#user-form').load('user_form.html', function () {

        $('.collapsible').collapsible();
        $('#create-username, #create-password').characterCounter();

        $('#create-password').keyup(function () {
            $('#retype-password').attr('pattern', $('#create-password').val());
        });
    });
}
