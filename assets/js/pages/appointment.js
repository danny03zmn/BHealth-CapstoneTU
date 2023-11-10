
$(document).ready(function() {

    $('.dt').on('change', function() {
        //alert();
        $("#btn_create").removeAttr('disabled');
    });

    $('#btn_create').on('click', function(e) {
        e.preventDefault();
        var p_id = $('#myselect2').val();
        var date = $('#datepicker-autoclose').val();
        var time = $('#timepicker1').val();
        //alert(time);

        $.ajax({
            type: 'POST',
            url: '../user_operation/chkappointment',
            dataType: 'json',
            data: {
                p_id: p_id,
                date: date,
                time: time
            },
            success: function(data) {
                if (data.status == 1) {
                    $(".status").css('color', 'red');
                    $(".status").text("Appointment booked on this day");
                    $("#btn_create").prop('disabled', 'true');
                } else if (data.status == 2) {
                    $(".status").css('color', 'red');
                    $(".status").text("Time slot allocated to other patient");
                } else {
                    $(".status").css('color', 'green');
                    $(".status").text("Appointment booked Successfully");
                }
            },
            error: function(data) {
                alert('oops! Something Went Wrong!!!');
            }
        });
    });

    $("#appointment_form").on("submit", function(e) {
        e.preventDefault();
        var route = $('#appointment_form').data('route');
        var form_data = $(this);
        $.ajax({
            type: 'POST',
            url: route,
            data: form_data.serialize(),
            success: function(response) {
                if (response.status == 'error') {
                    $(".status").css('color', 'red');
                    $(".status").text(response.message);
                    console.log(response.message);
                } else {
                    $(".status").css('color', 'green');
                    $(".status").text(response.message);
                }
            },
            error: function() {
                console.log("Something went Wrong!!!");
                $(".status").css('color', 'red');
                $(".status").text('Something went Wrong!!!');
            }
        });

    });

    $('.complete').on('click', function(e) {
        var id = $(this).data('id');
        var token = $("input[name='_token']").val();
        var status = 1;
        console.log(id);
        $(".complete").attr('disabled', true);
        if (confirm('Are you sure you want to confirm appointment?')) {

            $.ajax({
                type: "post",
                url: "appointment-status/" + id,
                data: { 'appointment_id': id, '_token': token, 'status': status },
                beforeSend: function() {
                    $('#preloader').show()
                },
                success: function(response) {
                    console.log(response);
                    toastr.success(response.Message);
                    $(".complete").attr('disabled', false);
                    location.reload();
                },
                error: function(response) {
                    console.error(response);
                    $(".complete").attr('disabled', false);
                    toastr.error(response.responseJSON.Message);
                },
                complete: function() {
                    $('#preloader').hide();
                }
            });
        }
    });
    $('.cancel').on('click', function(e) {
        var id = $(this).data('id');
        var token = $("input[name='_token']").val();
        var status = 2;
        $(".cancel").attr('disabled', true);
        if (confirm('Are you sure you want to cancel appointment?')) {

            $.ajax({
                type: "post",
                url: "appointment-status/" + id,
                data: { 'appointment_id': id, '_token': token, 'status': status },
                beforeSend: function() {
                    $('#pageloader').show();
                },
                success: function(response) {
                    toastr.success(response.Message);
                    $(".cancel").attr('disabled', false);
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                },
                error: function(response) {
                    $(".cancel").attr('disabled', false);
                    toastr.error(response.responseJSON.Message);
                },
                complete: function() {
                    $('#pageloader').hide();
                }
            });
        }
    });

});
